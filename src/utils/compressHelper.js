const fs = require("fs");
const tar = require("tar");
const AdmZip = require("adm-zip");

/**
 * 压缩zip
 * @param {string} rootPath 项目根目录
 * @param {string} buildFloder 需要打包的文件
 * @returns
 */
function createZip(rootPath, buildFloder = "dist") {
  return new Promise((resolve, reject) => {
    // 文件夹路径
    const folderPath = `${rootPath}/${buildFloder}`;
    // ZIP文件名
    const zipFileName = `${rootPath}/${buildFloder}/dist.zip`;
    if (!fs.existsSync(folderPath)) {
      return reject(`${buildFloder}文件夹不存在`);
    }
    // 创建AdmZip对象
    const zip = new AdmZip();
    if (fs.existsSync(zipFileName)) {
      // 文件存在
      fs.unlinkSync(zipFileName);
    }
    zip.addLocalFolder(folderPath);
    zip.writeZip(zipFileName);
    resolve();
  });
}
/**
 * 压缩tar.gz
 * @param {string} rootPath 项目根目录
 * @param {string} buildFloder 需要打包的文件
 * @returns
 */
function createTar(rootPath, buildFloder = "dist") {
  return new Promise((resolve, reject) => {
    // 文件夹路径
    const sourceFolder = `${rootPath}/${buildFloder}`;
    // ZIP文件名
    const outputFile = `${rootPath}/${buildFloder}/dist.tar.gz`;
    if (!fs.existsSync(sourceFolder)) {
      return reject(`${buildFloder}文件夹不存在`);
    }
    tar
      .c(
        {
          file: outputFile,
          cwd: sourceFolder, // 设置源地址的父目录作为压缩包的根目录
          // sync: true,
          gzip: true,
        },
        [""]
      )
      .then(() => {
        console.log("压缩完成!");
        resolve();
      })
      .catch((err) => {
        console.error("压缩过程中出现错误: ", err);
        reject();
      });
  });
}

module.exports = {
  createZip,
  createTar,
};
