const fs = require("fs");
const { spawn } = require("child_process");

/**
 * 判断项目是否vue并获取版本信息
 * @param {*} rootPath 项目根目录
 * @returns
 */
function getVueVersion(rootPath) {
  // 构建package.json的路径
  const packageJsonPath = `${rootPath}/package.json`;
  try {
    // 同步读取package.json文件
    const packageJson = fs.readFileSync(packageJsonPath, "utf8");
    // 解析文件内容为JSON
    const packageObj = JSON.parse(packageJson);

    // 检查是否有vue依赖
    const hasVueDependency =
      packageObj.dependencies && packageObj.dependencies.vue;
    const hasVueDevDependency =
      packageObj.devDependencies && packageObj.devDependencies.vue;
    let version = hasVueDependency || hasVueDevDependency;
    if (version) {
      version = version.replace(/[\^~]/g, "");
    }
    return {
      version,
    };
  } catch (error) {
    // 错误处理，例如文件不存在或JSON解析失败
    console.error(error);
    return false;
  }
}
/**
 * 分析配置文件判断打包后项目放在哪个文件夹
 * @param {*} rootPath 项目根目录
 * @returns
 */
function getBuildFolder(rootPath) {
  const configFiles = ["vite.config.js", "vue.config.js"];
  const folderRegex = /(outDir|outputDir):"(.*?)"/i;
  return configFiles.reduce((folder, configFile) => {
    if (fs.existsSync(`${rootPath}/${configFile}`)) {
      const content = fs.readFileSync(`${rootPath}/${configFile}`, "utf8");
      const match = folderRegex.exec(
        content.replace(/[\r\n\s]/g, "").replace(/[']/g, '"')
      );
      if (match) {
        return match[2];
      }
    }
    return folder;
  }, "dist");
}
function runBuild(rootPath) {
  console.log(`Building: 0%`);
  return new Promise((resolve, reject) => {
    const cmd = spawn("npm", ["run", "build"], {
      cwd: rootPath,
      shell: true,
    });
    let stderr = "";
    // 处理子进程的错误
    cmd.on("error", (error) => {
      console.error(`Building Error: ${error}`);
      reject(error);
    });
    cmd.stdout.on("data", (data) => {
      console.log(`${data}`);
    });

    cmd.stderr.on("data", (data) => {
      stderr += data.toString();
    });
    cmd.on("close", (code) => {
      if (code !== 0) {
        console.error(`Building Error: ${stderr}`);
        reject(stderr);
      } else {
        console.log(`Building: 100%`);
        resolve();
      }
    });
  });
}

module.exports = {
  getVueVersion,
  getBuildFolder,
  runBuild,
};
