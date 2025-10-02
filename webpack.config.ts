import type { Configuration } from 'webpack';
import { merge } from 'webpack-merge';
import grafanaConfig, { Env } from './.config/webpack/webpack.config';

const config = async (env: Env): Promise<Configuration> => {
  const baseConfig = await grafanaConfig(env);

  return merge(baseConfig, {
    // Adds a webpack plugin to the configuration
    module: {
      rules: [
        {
          test: /\.wasm/,
          type: 'asset/resource',
        },
      ],
    },
    output: {
      library: { type: 'umd' },
      publicPath: 'auto',
    },
    resolve: {
      fallback: { fs: false, path: require.resolve('path-browserify') },
    },
  });
};

export default config;
