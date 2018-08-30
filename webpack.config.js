var path = require('path');
var webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var CleanWebpackPlugin = require('clean-webpack-plugin');

var extractPlugin = new ExtractTextPlugin({
	filename: 'main.css'
})

module.exports = {
	devServer: {
        inline:true,
        port: 8080
    },
	entry: './public/javascripts/index.js',
	output: {
		path: __dirname + '/public/dist',
		filename: 'app.js',
		// publicPath: '/public/dist',
	    library: 'app',
		libraryTarget: 'var'
	},
	module: {
		rules: [
		    {
                test: /\.js$/,
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            presets: ['es2015']
                        }
                    }
                ]
	     	},
	     	{
		        test: /\.css$/,
            	use: extractPlugin.extract({
            		use: ["css-loader"]
            	})
		    },
            {
                test: /\.html$/,
                use: ['html-loader']
            },
            {
                test: /\.(jpg|png|svg)$/,
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            name: '[name].[ext]',
                            outputPath: 'img/',
                            publicPath: 'img/'
                        }
                    }
                ]
            }
            /* For SASS */
            // {
            // 	test: /\.scss$/,
            // 	use: extractPlugin.extract({
            // 		use: ['css-loader', 'sass-loader']
            // 	})
            // }
		]	
	},
	plugins: [
        extractPlugin,
        new HtmlWebpackPlugin({
            template: 'public/index.html'
        }),
        new CleanWebpackPlugin(['dist'])
	]
};