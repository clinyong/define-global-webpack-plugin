import * as ParserHelpers from "webpack/lib/ParserHelpers";
import * as ConstDependency from "webpack/lib/dependencies/ConstDependency";
import * as NullFactory from "webpack/lib/NullFactory";
import * as Template from "webpack/lib/Template";

const GLOBAL_NAME = "__webpack_global__";
const pluginName = "DefineGlobalPlugin";

export class DefineGlobalPlugin {
	definitions: object;

	constructor(option: object) {
		this.definitions = option;
	}

	setDependency(compilation) {
		compilation.dependencyFactories.set(ConstDependency, new NullFactory());
		compilation.dependencyTemplates.set(
			ConstDependency,
			new ConstDependency.Template()
		);
	}

	applyWebpack3(compiler) {
		const definitions = this.definitions;
		compiler.plugin("compilation", (compilation, params) => {
			this.setDependency(compilation);

			compilation.mainTemplate.plugin("require-extensions", function(
				source
			) {
				const buf = [source];
				buf.push("");
				buf.push(
					`${this.requireFn}.${GLOBAL_NAME} = ${JSON.stringify(
						definitions
					)};`
				);
				return this.asString(buf);
			});

			params.normalModuleFactory.plugin(
				"parser",
				(parser, parserOptions) => {
					Object.keys(this.definitions).forEach(key => {
						parser.plugin(
							`expression ${GLOBAL_NAME}.${key}`,
							ParserHelpers.toConstantDependency(
								`__webpack_require__.${GLOBAL_NAME}.${key}`
							)
						);
					});
				}
			);
		});
	}

	applyWebpack4(compiler) {
		compiler.hooks.compilation.tap(
			pluginName,
			(compilation, { normalModuleFactory }) => {
				this.setDependency(compilation);

				const mainTemplate = compilation.mainTemplate;
				mainTemplate.hooks.requireExtensions.tap(pluginName, source => {
					const buf = [source];
					buf.push("");
					buf.push(
						`${
							mainTemplate.requireFn
						}.${GLOBAL_NAME} = ${JSON.stringify(this.definitions)};`
					);
					return Template.asString(buf);
				});

				const handler = (parser, parserOptions) => {
					Object.keys(this.definitions).forEach(key => {
						parser.hooks.expression
							.for(`${GLOBAL_NAME}.${key}`)
							.tap(
								pluginName,
								ParserHelpers.toConstantDependencyWithWebpackRequire(
									parser,
									`__webpack_require__.${GLOBAL_NAME}.${key}`
								)
							);
					});
				};

				[
					"javascript/auto",
					"javascript/dynamic",
					"javascript/esm"
				].forEach(t => {
					normalModuleFactory.hooks.parser
						.for(t)
						.tap(pluginName, handler);
				});
			}
		);
	}

	apply(compiler) {
		if ("hooks" in compiler) {
			this.applyWebpack4(compiler);
		} else {
			this.applyWebpack3(compiler);
		}
	}
}
