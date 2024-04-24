const vscode = require("vscode");
const path = require("path");

class TreeNode extends vscode.TreeItem {
  constructor(label, collapsibleState) {
    super(label, collapsibleState);
    this.iconPath = {
      light: path.join(
        __filename,
        "..",
        "..",
        "assets",
        "images",
        "light",
        "server.svg"
      ),
      dark: path.join(
        __filename,
        "..",
        "..",
        "assets",
        "images",
        "dark",
        "server.svg"
      ),
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
      return server.map((item) => item.name);
    } else {
      return [];
    }
  }
  getChildren() {
    return this.tree.map(
      (label) => new TreeNode(label, vscode.TreeItemCollapsibleState.None)
    );
  }
  getTreeItem(element) {
    return element;
    // const treeItem = new vscode.TreeItem(
    //   offset,
    //   vscode.TreeItemCollapsibleState.None
    // );
    // treeItem.command = {
    //   command: "extension.openJsonSelection",
    //   title: "Action 1",
    // };
    // treeItem.iconPath = {
    //   light: "./../assets/images/server.svg",
    //   dark: "./../assets/images/server.svg",
    // };
    // // treeItem.contextValue = valueNode.type;
    // return treeItem;
  }
}

module.exports = serverProvider;
