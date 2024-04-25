const vscode = require("vscode");
const { Client } = require("ssh2");

/**
 * 建立ssh连接
 * @param {*} server 服务器配置
 * @returns
 */
function getSSHConnect(server) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    conn
      .connect({
        host: server.host,
        port: server.port,
        username: server.username,
        password: server.password,
      })
      .on("ready", () => {
        console.log("SSH Client Ready");
        resolve(conn);
      })
      .on("error", (error) => {
        console.log("SSH Client Error", error);
        reject("服务器连接失败");
      })
      .on("close", () => {
        console.log("SSH Client Close");
      });
  });
}
/**
 * 上传文件
 * @param {*} rootPath 项目根目录
 * @param {*} conn 连接实例
 * @param {*} server 服务器配置
 * @returns
 */
function uploadFile(rootPath, conn, server, progress) {
  return new Promise((resolve, reject) => {
    // 随机文件名
    let group = /([^/\\]+)[/\\]?$/.exec(server.path);
    let fileName = `dist${group ? "_" + group[1] : ""}.tar.gz`;
    let localFile = `${rootPath}/dist/dist.tar.gz`;
    let remoteFile = `/var/tmp/${fileName}`;
    if (server.path.indexOf(":") >= 0) {
      remoteFile = `C:\\Windows\\Temp\\${fileName}`;
    }
    let lastTime = Date.now();
    let lastIncrement = 0;
    conn.sftp((err, sftp) => {
      if (err) throw err;
      sftp.fastPut(
        localFile,
        remoteFile,
        {
          step: (totalTransferredBytes, chunk, totalBytes) => {
            const currentTime = Date.now();
            const elapsedTime = currentTime - lastTime;
            if (elapsedTime > 200) {
              let increment =
                !isNaN(totalBytes) && totalBytes !== 0
                  ? Math.round((totalTransferredBytes / totalBytes) * 100)
                  : 0;
              progress.report({
                message: `${increment}%`,
                increment: increment - lastIncrement,
              });
              lastTime = currentTime;
              lastIncrement = increment;
              console.log(`Progress: ${increment}%`);
            }
          },
        },
        (err) => {
          if (err) {
            console.log(err);
            return reject("文件上传失败");
          }
          sftp.end();
          console.log("Uploaded file successfully");
          resolve(remoteFile);
        }
      );
    });
  });
}
/**
 * 解压文件
 * @param {*} conn 连接实例
 * @param {*} server 服务器配置
 * @param {*} remoteFile 远程压缩包路径
 * @returns
 */
async function extractFile(conn, server, remoteFile) {
  return new Promise((resolve, reject) => {
    let system = server.path.indexOf(":") >= 0 ? "windows" : "linux";
    // linux
    let cmd = `rm ${server.path} -rf && mkdir -p ${server.path} && tar -xzvf ${remoteFile} -C ${server.path}`;
    if (system === "windows") {
      // windows 支持开源的bsdtar
      cmd = `(if exist ${server.path} (rd /s /q ${server.path})) && md ${server.path} && (where bsdtar >nul 2>nul && (bsdtar -xzvf ${remoteFile} -C ${server.path}) || (tar -xzvf ${remoteFile} -C ${server.path}))`;
    }
    console.log("执行指令", cmd);
    conn.exec(cmd, (err, stream) => {
      if (err) throw err;
      // 设置伪终端的编码方式为 utf-8
      stream.setEncoding("utf-8");
      stream
        .on("close", (code, signal) => {
          console.log(
            "Stream :: close :: code: " + code + ", signal: " + signal
          );
          conn.end();
          if (code == 0) {
            resolve();
          } else {
            reject();
          }
        })
        .on("data", (data) => {
          console.log("STDOUT: " + data);
        })
        .stderr.on("data", (data) => {
          console.error("STDEER: " + data);
        });
    });
  });
}
/**
 * 空投
 * @param {*} rootPath 项目根目录
 * @param {*} server 服务器配置
 * @returns
 */
function dropFile(rootPath, server) {
  return new Promise(async (resolve, reject) => {
    try {
      // 连接服务器
      const conn = await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "连接服务器",
          cancellable: false,
        },
        async (progress) => {
          progress.report({ increment: 0 });
          const conn = await getSSHConnect(server);
          progress.report({ increment: 100 });
          return Promise.resolve(conn);
        }
      );
      // 上传
      let remoteFile = await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "上传代码",
          cancellable: false,
        },
        (progress) => {
          progress.report({ increment: 0 });
          return uploadFile(rootPath, conn, server, progress);
        }
      );
      // 部署
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "部署代码",
          cancellable: false,
        },
        async (progress) => {
          progress.report({ increment: 0 });
          await extractFile(conn, server, remoteFile, progress);
          progress.report({ increment: 100 });
          return Promise.resolve();
        }
      );
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}
module.exports = {
  dropFile,
};
