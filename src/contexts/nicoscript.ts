import type { nicoScript } from "@/@types/types";

let nicoScripts: nicoScript = {
  reverse: [],
  default: [],
  replace: [],
  ban: [],
};
const resetNicoScripts = () => {
  nicoScripts = {
    reverse: [],
    default: [],
    replace: [],
    ban: [],
  };
};
export { nicoScripts, resetNicoScripts };
