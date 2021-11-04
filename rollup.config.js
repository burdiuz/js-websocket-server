import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonJS from '@rollup/plugin-commonjs';
import copy from 'rollup-plugin-copy';

const keepDirStruct = (name, extension, fullPath) => fullPath;

export default [
  {
    input: './index.ts',
    output: {
      file: '../../dist/deferred-data-access/dist/deferred-data-access.js',
      format: 'es',
      sourcemap: true,
    },
    plugins: [typescript()],
  },
];