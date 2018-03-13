## Define Global Plugin

A webpack plugin to define global variables.

### Install

```bash
$ yarn add define-global-webpack-plugin -D
```

### Usage

In `webpack.config.js` file

```js
const { DefineGlobalPlugin } = require("define-global-webpack-plugin");

module.exports = {
	//...
	plugins: [
		new DefineGlobalPlugin({
			foo: "bar"
		})
	]
};
```

In your js file

```js
console.log(__webpack_global__.foo); // bar
```
