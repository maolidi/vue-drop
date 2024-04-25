const vscode = require("vscode");
const path = require("path");

class TreeNode extends vscode.TreeItem {
  constructor(label, icon, collapsibleState) {
    super(label, collapsibleState);
    this.iconPath = {
      light: path.join(
        __filename,
        "..",
        "..",
        "assets",
        "images",
        "light",
        icon
      ),
      dark: path.join(__filename, "..", "..", "assets", "images", "dark", icon),
    };
  }
}

class serverProvider {
  constructor(context) {
    this.tree = this.getServer();
    // 监听配置更改
    context.subscriptions.push(
      vscode.workspace.onDidChangeConfiguration((event) => {
        // 检查是否有相关配置更改
        if (event.affectsConfiguration("VueDrop")) {
          // 如果有，刷新树形视图
          this.refresh();
        }
      })
    );
    // 事件发射器，用于在数据更新时通知VS Code
    this._onDidChangeTreeData = new vscode.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
  }
  refresh() {
    this.tree = this.getServer();
    this._onDidChangeTreeData.fire(); // 触发事件通知更新
  }
  getServer() {
    const server = vscode.workspace.getConfiguration("VueDrop").get("server");
    if (server) {
      return server.map((item) => {
        let icon = item.path.indexOf(":") >= 0 ? "windows.svg" : "shell.svg";
        return {
          ...item,
          icon,
        };
      });
    } else {
      return [];
    }
  }
  getChildren() {
    let isShowHost = vscode.workspace
      .getConfiguration("VueDrop")
      .get("showHost.enabled");
    return this.tree.map(
      (item) =>
        new TreeNode(
          isShowHost ? `${item.name}【${item.host}】` : item.name,
          item.icon,
          vscode.TreeItemCollapsibleState.None
        )
    );
  }
  getTreeItem(element) {
    return element;
  }
}

module.exports = serverProvider;
