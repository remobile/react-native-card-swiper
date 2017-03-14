# React Native Card Swiper (remobile)
A react-native card swiper write in js

## Installation
```sh
npm install @remobile/react-native-card-swiper --save
```

## Usage

### Example
```js
'use strict';

var React = require('react');
var ReactNative = require('react-native');
var {
    StyleSheet,
    View,
    Text,
} = ReactNative;
var CardSwiper = require('@remobile/react-native-card-swiper');

module.exports = React.createClass({
    getDefaultProps: function() {
        return {
            vertical: false,
        };
    },
    renderRow(obj) {
        return (
            <View style={styles.panel}>
                <Text>{obj}</Text>
            </View>
        )
    },
    onPressRow(obj, index) {
        console.log('onPressRow', obj, index);
    },
    onChange(obj, index) {
        console.log('onChange', obj, index);
    },
    render() {
        const {vertical} = this.props;
        return (
            <View style={[styles.container, {paddingLeft: vertical ? 50 : 0}]}>
                <CardSwiper
                    list={[1, 2, 3]}
                    vertical={vertical}
                    width={vertical ? 180 : sr.tw}
                    height={vertical ? sr.th/2 : 150}
                    loop={true}
                    onPress={this.onPressRow}
                    onChange={this.onChange}
                    renderRow={this.renderRow}
                    />
            </View>
        );
    }
});


var styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 100,
    },
    panel: {
        backgroundColor: 'green',
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
```

## Screencasts

![vertical](https://github.com/remobile/react-native-card-swiper/blob/master/screencasts/vertical.gif)
![horizontal](https://github.com/remobile/react-native-card-swiper/blob/master/screencasts/horizontal.gif)

#### Props
- `list: PropTypes.list` card data list
- `index: PropTypes.number` card initial index: default(0)
- `width: PropTypes.number.required` card item width
- `height: PropTypes.number.required` card item height
- `loop: propTypes.boolean` swiper is loop: default(false)
- `vertical: propTypes.boolean` swiper derection is vertical: default(false)
- `renderRow: PropTypes.func [args: data]` row render function
- `onPress: PropTypes.func [args: data]` row press callback function
- `onChange: PropTypes.func [args: data]` row change callback function

#### Method
- `scrollTo(index)` scroll to index card
