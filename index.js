'use strict';

const React = require('react');
const ReactNative = require('react-native');
const {
    View,
    TouchableOpacity,
    ScrollView,
    Animated,
    InteractionManager,
} = ReactNative;
const _ = require('lodash');
const TimerMixin = require('react-timer-mixin');

module.exports = React.createClass({
    mixins: [TimerMixin],
    getDefaultProps () {
        return {
            index: 0,
            vertical: false,
            loop: false,
            ratio: 0.872,
        };
    },
    getInitialState () {
        const { list, width, height, vertical } = this.props;
        const size = vertical ? height : width;
        this.blockSize = size * 0.708;
        this.moveDistance = size * 0.733;
        this.offset = this.moveDistance - ((size - this.moveDistance) / 2);

        this.count = list.length;
        this.list = [list[this.count - 2], list[this.count - 1], ...list, list[0], list[1]];

        const scaleArr = [];
        const translateArr = [];
        const opacityArr = [];
        for (let i = 0; i < this.count + 4; i++) {
            scaleArr.push(new Animated.Value(1));
            translateArr.push(new Animated.Value(0));
            opacityArr.push(new Animated.Value(0));
        }
        return { scaleArr, translateArr, opacityArr };
    },
    componentWillReceiveProps (nextProps) {
        const { list, width, height, vertical } = nextProps;
        const { list: _list, width: _width, height: _height, vertical: _vertical } = this.props;
        if (width !== _width || height !== _height || vertical !== _vertical) {
            const size = vertical ? height : width;
            this.blockSize = size * 0.708;
            this.moveDistance = size * 0.733;
            this.offset = this.moveDistance - ((size - this.moveDistance) / 2);
        }

        if (this.count !== _list.length) {
            this.count = list.length;

            const scaleArr = [];
            const translateArr = [];
            for (let i = 0; i < this.count + 4; i++) {
                scaleArr.push(new Animated.Value(1));
                translateArr.push(new Animated.Value(0));
            }
            this.setState({ scaleArr, translateArr });
        }

        if (!_.isEqual(list, _list)) {
            this.list = [list[this.count - 2], list[this.count - 1], ...list, list[0], list[1]];
        }
    },
    componentDidMount () {
        const { vertical, index, loop } = this.props;
        this.setTimeout(() => {
            this.assistScroll.scrollTo({ [vertical ? 'y' : 'x']: (this.moveDistance * (loop ? index + 1 : index) || 1), animated: false });
            this.setTimeout(() => {
                this.setState({ initialized: true });
            }, 100);
        }, 100);
    },
    getShowViews () {
        const { loop, width, height, vertical } = this.props;
        const { opacityArr, scaleArr, translateArr } = this.state;
        return this.list.map((o, i) => {
            if (!loop && (i < 1 || i >= this.list.length - 3)) {
                return <View key={i} style={{ width: vertical ? width : this.moveDistance, height: vertical ? this.moveDistance : height }} />;
            }
            const margin = (this.moveDistance - this.blockSize) / 2;
            return (
                <View key={i} style={{ flexDirection: vertical ? 'column' : 'row' }}>
                    <View style={{ [vertical ? 'height' : 'width']: margin }} />
                    <Animated.View style={{ width: vertical ? width : this.blockSize, height: vertical ? this.blockSize : height, opacity: opacityArr[i], transform: [{ [vertical ? 'scaleX' : 'scaleY']: scaleArr[i] }, { [vertical ? 'translateX' : 'translateY']: translateArr[i] }] }}>
                        {this.props.renderRow(this.list[i + (loop ? 0 : 1)], loop ? (i + 1) % this.count : i - 1)}
                    </Animated.View>
                    <View style={{ [vertical ? 'height' : 'width']: margin }} />
                </View>
            );
        });
    },
    getAssistViews () {
        const { list, loop, width, height, vertical } = this.props;
        const count = this.count + (loop ? 2 : 0);
        const margin = (this.moveDistance - this.blockSize) / 2;
        const views = [];
        for (let i = 0; i < count; i++) {
            views.push(
                <View key={i} style={{ flexDirection: vertical ? 'column' : 'row' }}>
                    <View style={{ [vertical ? 'height' : 'width']: margin }} />
                    <TouchableOpacity onPress={() => this.props.onPress(list[loop ? (i + 2) % this.count : i], loop ? (i + 2) % this.count : i)}>
                        <View style={{ width: vertical ? width : this.blockSize, height: vertical ? this.blockSize : height }} />
                    </TouchableOpacity>
                    <View style={{ [vertical ? 'height' : 'width']: margin }} />
                </View>
            );
        }
        return views;
    },
    scrollTo (index) {
        const { vertical } = this.props;
        this.scrollTargetIndex = index;
        this.assistScroll.scrollTo({ [vertical ? 'y' : 'x']: this.moveDistance * index, animated: true });
    },
    onScroll (e) {
        const { loop, vertical } = this.props;
        if (this.mainScroll && this.assistScroll) {
            const val = e.nativeEvent.contentOffset[vertical ? 'y' : 'x'];
            if (loop && Math.abs(val - ((this.count + 1) * this.moveDistance)) < 0.5) {
                this.mainScroll.scrollTo({ [vertical ? 'y' : 'x']: this.moveDistance + this.offset, animated: false });
                this.assistScroll.scrollTo({ [vertical ? 'y' : 'x']: this.moveDistance, animated: false });
            } else if (loop && Math.abs(val) < 0.1) {
                this.mainScroll.scrollTo({ [vertical ? 'y' : 'x']: this.moveDistance * this.count + this.offset, animated: false });
                this.assistScroll.scrollTo({ [vertical ? 'y' : 'x']: this.moveDistance * this.count, animated: false });
            } else {
                this.mainScroll.scrollTo({ [vertical ? 'y' : 'x']: val + this.offset, animated: false });
            }
            const currentPageFloat = val / this.moveDistance;
            this.cardAnimated(currentPageFloat);
        }
    },
    cardAnimated (currentPageFloat) {
        const { loop, list, width, height, vertical, ratio, onChange } = this.props;
        const { scaleArr, translateArr, opacityArr } = this.state;
        const index = loop ? (Math.round(currentPageFloat) + 2) % this.count : Math.round(currentPageFloat);
        if (this.lastChangeIndex !== index) {
            if (this.scrollTargetIndex == null) {
                onChange && onChange(list[index], index);
            } else if (this.scrollTargetIndex === index) {
                this.scrollTargetIndex = null;
            }
            this.lastChangeIndex = index;
        }

        for (let i = 0; i < this.count + 4; i++) {
            let r = 0;
            const currentPageInt = parseInt(currentPageFloat);
            if (i == 2) {
                r = Math.abs(currentPageFloat - (this.count + 1)) < 0.1 ? 1 : 0;
            }
            if (i == this.count + 1) {
                r = Math.abs(currentPageFloat) < 0.1 ? 1 : 0;
            }
            if (i - 1 == currentPageInt) {
                r = 1 - currentPageFloat % 1;
            } else if (i - 1 == currentPageInt + 1) {
                r = currentPageFloat % 1;
            }
            const scale = ratio + ((1 - ratio) * r);
            const translate = (vertical ? width : height) * (1 - scale) / 8;
            opacityArr[i].setValue(Math.pow(scale, 5));
            scaleArr[i].setValue(scale);
            translateArr[i].setValue(translate);
        }
    },
    render () {
        const { width, height, vertical } = this.props;
        const totalWidth = (vertical ? width : this.moveDistance) * this.list.length;
        const totalHeight = (vertical ? this.moveDistance : height) * this.list.length;
        return (
            <View style={{ width, height, overflow: 'hidden' }}>
                <ScrollView
                    horizontal={!vertical}
                    pointerEvents='none'
                    ref={ref => { this.mainScroll = ref; }}
                    showsHorizontalScrollIndicator={false}
                    >
                    {this.state.initialized ? this.getShowViews() : <View style={{ width: totalWidth, height: totalHeight }} />}
                </ScrollView>
                <View style={[{ position: 'absolute', left: 0, top: 0, backgroundColor:'transparent' }, vertical ? { height: (height - this.moveDistance) / 2, width } : { width: (width - this.moveDistance) / 2, height }]} />
                <View style={[{ position: 'absolute', backgroundColor:'transparent' }, vertical ? { height: (height - this.moveDistance) / 2, width, bottom: 0, left: 0 } : { width: (width - this.moveDistance) / 2, height, right: 0, top: 0 }]} />
                <ScrollView
                    style={vertical ? { position: 'absolute', height: this.moveDistance, width, top: (height - this.moveDistance) / 2, left: 0 } : { position: 'absolute', width: this.moveDistance, height, left: (width - this.moveDistance) / 2, top: 0 }}
                    horizontal={!vertical}
                    pagingEnabled
                    ref={ref => { this.assistScroll = ref; }}
                    onScroll={e => this.onScroll(e)}
                    scrollEventThrottle={16}
                    showsHorizontalScrollIndicator={false}
                    showsVerticalScrollIndicator={false}
                    >
                    {this.getAssistViews()}
                </ScrollView>
            </View>
        );
    },
});
