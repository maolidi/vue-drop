const fs = require("fs");

function clean(rootPath, buildFloder) {
  return new Promise((resolve) => {
    const path = `${rootPath}/${buildFloder}/dist.tar.gz`;
    if (fs.existsSync(path)) {
      fs.unlink(`${rootPath}/${buildFloder}/dist.tar.gz`, (err) => {
        if (err) {
          console.log(err);
        }
        resolve();
      });
    } else {
      resolve();
    }
  });
}

module.exports = {
  clean,
};
