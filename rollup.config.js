import { uglify } from "rollup-plugin-uglify";
import shebang from "rollup-plugin-add-shebang";

export default {
  input: "./index.js",
  output: {
    file: "dist/index.js",
  },
  plugins: [
    uglify(),
    shebang({
      include: "dist/index.js",
    }),
  ],
};
