const fs = require("fs");
const path = require("path");
const tar = require("tar");
const through2 = require("through2");

/**
 * 压缩tar.gz
 * @param {string} rootPath 项目根目录
 * @param {string} buildFloder 需要打包的文件
 * @returns
 */
function createTar(rootPath, buildFloder = "dist", progress) {
  return new Promise(async (resolve, reject) => {
    // 文件夹路径
    const sourceFolder = `${rootPath}/${buildFloder}`;
    // ZIP文件名
    const outputFile = `${rootPath}/${buildFloder}/dist.tar.gz`;
    if (!fs.existsSync(sourceFolder)) {
      return reject(`${buildFloder}文件夹不存在`);
    }
    const pack = tar.c(
      {
        // file: outputFile,
        cwd: sourceFolder, // 设置源地址的父目录作为压缩包的根目录
        // sync: true,
        gzip: true,
      },
      [""]
    );
    // 创建一个可写的文件流
    const writeStream = fs.createWriteStream(outputFile);
    // 初始化进度跟踪参数
    let totalCompressedBytes = 0;
    let totalBytes = await getDirectorySize(sourceFolder);
    let lastTime = Date.now();
    let lastIncrement = 0;
    // 创建一个通过 through2 来跟踪进度的中间流
    const progressStream = through2(
      { objectMode: true },
      (chunk, enc, callback) => {
        totalCompressedBytes += chunk.length;
        const currentTime = Date.now();
        const elapsedTime = currentTime - lastTime;
        if (elapsedTime > 200) {
          // 计算并打印进度
          let increment =
            !isNaN(totalBytes) && totalBytes !== 0
              ? Math.round((totalCompressedBytes / totalBytes) * 100)
              : 0;
          // 这里increment会加到上一次设置的increment里，所以每次要设置为累加百分比
          progress.report({
            message: `${increment}%`,
            increment: increment - lastIncrement,
          });
          lastTime = currentTime;
          lastIncrement = increment;
          console.log(`Compressing: ${increment}%`);
        }
        callback(null, chunk);
      }
    );
    // 监听 'end' 事件，确保所有数据都已经写入
    pack.on("end", () => {
      progress.report({
        message: `100%`,
        increment: 100 - lastIncrement,
      });
      console.log(`Compressing: 100%`);
    });

    // 管道压缩数据到文件流
    pack.pipe(progressStream).pipe(writeStream);
    // 监听 'finish' 事件以知道何时完成
    writeStream.on("finish", () => {
      console.log("Compressed file successfully");
      resolve();
    });

    // 监听 'error' 事件以处理错误
    writeStream.on("error", (err) => {
      reject(err);
    });
  });
}

async function getDirectorySize(dirPath) {
  let totalSize = 0;

  try {
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const filePath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        // 如果是目录，递归计算其大小
        totalSize += await getDirectorySize(filePath);
      } else {
        // 如果是文件，直接获取其大小
        const stats = await fs.promises.stat(filePath);
        totalSize += stats.size;
      }
    }

    return totalSize;
  } catch (error) {
    console.error(`Error calculating directory size for ${dirPath}:`, error);
    throw error;
  }
}

module.exports = {
  createTar,
};
