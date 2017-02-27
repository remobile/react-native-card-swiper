'use strict';

var React = require('react');
var ReactNative = require('react-native');
var {
    View,
    TouchableOpacity,
    ScrollView,
    Animated,
    InteractionManager,
} = ReactNative;

module.exports = React.createClass({
    getDefaultProps() {
        return {
            vertical: false,
            loop: false,
            ratio: 0.872
        };
    },
    initialWidthProps(props) {
        const {list, width, height, vertical} = props;
        const size = vertical ? height : width;
        this.blockSize = size*0.708;
        this.moveDistance = size*0.733;
        this.offset = this.moveDistance-((size-this.moveDistance)/2);
        this.currentPageFloat = 0;

        this.list = list;
        this.count = list.length;
        this.list.unshift(this.list[this.list.length-1]);
        this.list.unshift(this.list[this.list.length-2]);
        this.list.push(this.list[2]);
        this.list.push(this.list[3]);

        let scaleArr = [];
        let translateArr = [];
        for(let i = 0; i < this.count+4; i++) {
            scaleArr.push(new Animated.Value(0));
            translateArr.push(new Animated.Value(0));
        }
        return {scaleArr, translateArr};
    },
    getInitialState() {
        return this.initialWidthProps(this.props);
    },
    componentWillReceiveProps(nextProps) {
        this.setState(this.initialWidthProps(nextProps));
    },
    componentDidMount() {
        const {vertical} = this.props;
        InteractionManager.runAfterInteractions(() => {
            this.mainScroll.scrollTo({[vertical?'y':'x']: this.offset+1, animated: false});
            this.assistScroll.scrollTo({[vertical?'y':'x']: 1, animated: false});
        });
    },
    getShowViews() {
        const {loop, width, height, vertical} = this.props;
        return this.list.map((o, i) => {
            if (!loop && (i < 1 || i >= this.list.length-3)) {
                return <View key={i} style = {{width: vertical?width:this.moveDistance, height: vertical?this.moveDistance:height}} />
            }
            let margin = (this.moveDistance-this.blockSize)/2;
            return(
                <View key={i} style = {{flexDirection: vertical?'column':'row'}}>
                    <View style = {{[vertical?'height':'width']: margin}} />
                    <Animated.View style = {{width: vertical?width:this.blockSize, height: vertical?this.blockSize:height, transform: [{[vertical?'scaleX':'scaleY']: this.state.scaleArr[i]}, {[vertical?'translateX':'translateY']: this.state.translateArr[i]}]}}>
                        {this.props.renderRow(this.list[i+(loop?0:1)])}
                    </Animated.View>
                    <View style = {{[vertical?'height':'width']: margin}} />
                </View>
            )
        })
    },
    getAssistViews() {
        const {loop, width, height, vertical} = this.props;
        const count = this.count + (loop ? 2 : 0);
        const margin = (this.moveDistance-this.blockSize)/2;
        const views = [];
        for(let i = 0; i < count; i++) {
            views.push(
                <View key = {i} style = {{flexDirection: vertical?'column':'row'}}>
                    <View style = {{[vertical?'height':'width']: margin}} />
                    <TouchableOpacity onPress = {() => this.props.onPress(this.list[i+(loop?1:2)])}>
                        <View style = {{width: vertical?width:this.blockSize, height: vertical?this.blockSize:height}} />
                    </TouchableOpacity>
                    <View style = {{[vertical?'height':'width']: margin}} />
                </View>
            );
        }
        return views;
    },
    onScroll(e) {
        const {loop, vertical} = this.props;
        if(this.mainScroll && this.assistScroll) {
            let val = e.nativeEvent.contentOffset[vertical?'y':'x'];
            if (loop && Math.abs(val - ((this.count + 1) * this.moveDistance)) < 0.5) {
                this.mainScroll.scrollTo({[vertical?'y':'x']: this.moveDistance + this.offset, animated: false});
                this.assistScroll.scrollTo({[vertical?'y':'x']: this.moveDistance, animated: false});
            } else if (loop && Math.abs(val) < 0.1) {
                this.mainScroll.scrollTo({[vertical?'y':'x']: this.moveDistance * this.count + this.offset, animated: false});
                this.assistScroll.scrollTo({[vertical?'y':'x']: this.moveDistance * this.count, animated: false});
            } else {
                this.mainScroll.scrollTo({[vertical?'y':'x']: val + this.offset, animated: false});
            }
            let currentPageFloat = val / this.moveDistance;
            this.cardAnimated(currentPageFloat);
        }
    },
    cardAnimated(currentPageFloat) {
        const {loop, width, height, vertical, ratio, onChange} = this.props;
        let index = loop ? (Math.round(currentPageFloat)+1)%this.count : (Math.round(currentPageFloat)+2)%this.count;
        if (this.lastChangeIndex !== index) {
            onChange && onChange(this.list[index]);
            this.lastChangeIndex = index;
        }

        for(let i = 0; i < this.count+4; i++) {
            let r = 0;
            let currentPageInt = parseInt(currentPageFloat);
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
            let scale = ratio + ((1 - ratio) * r);
            let translate = (vertical?width:height) * (1 - scale) / 8;
            Animated.timing(this.state.scaleArr[i], {
                toValue: scale,
                duration: 0
            }).start();
            Animated.timing(this.state.translateArr[i], {
                toValue: translate,
                duration: 0
            }).start();
        }
    },
    render() {
        const {width, height, vertical} = this.props;
        return (
            <View style={{width, height, overflow: 'hidden'}}>
                <ScrollView
                    horizontal = {!vertical}
                    pointerEvents = 'none'
                    ref = {ref => this.mainScroll = ref}
                    showsHorizontalScrollIndicator = {false}
                    >
                    {this.getShowViews()}
                </ScrollView>
                <View style = {vertical ? {position: 'absolute', height: (height-this.moveDistance)/2, width, top: 0, left: 0} : {width: (width-this.moveDistance)/2, height, position: 'absolute', left: 0, top: 0}} />
                <View style = {vertical ? {position: 'absolute', height: (height-this.moveDistance)/2, width, bottom: 0, left: 0} : {width: (width-this.moveDistance)/2, height, position: 'absolute', right: 0, top: 0}} />
                <ScrollView
                    style = {vertical ? {position: 'absolute', height: this.moveDistance, width, top: (height-this.moveDistance)/2, left: 0} : {position: 'absolute', width: this.moveDistance, height, left: (width-this.moveDistance)/2, top: 0}}
                    horizontal = {!vertical}
                    pagingEnabled = {true}
                    ref = {ref => this.assistScroll = ref}
                    onScroll = {e => this.onScroll(e)}
                    scrollEventThrottle = {16}
                    showsHorizontalScrollIndicator = {false}
                    showsVerticalScrollIndicator = {false}
                    >
                    {this.getAssistViews()}
                </ScrollView>
            </View>
        )
    },
});
