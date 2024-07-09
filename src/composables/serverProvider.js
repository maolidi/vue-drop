const vscode = require("vscode");
const path = require("path");

class TreeNode extends vscode.TreeItem {
  constructor(label, icon, collapsibleState, children) {
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
    this.contextValue = children ? "folderNode" : "serverNode";
    if (Array.isArray(children)) {
      this.children = children;
    }
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
  getServer(server) {
    server =
      server || vscode.workspace.getConfiguration("VueDrop").get("server");
    let result = [];
    for (let item of server) {
      result.push(this.getItem(item));
    }
    return result;
  }

  getItem(item) {
    let isFolder = Array.isArray(item.children);
    let icon = isFolder
      ? "folder.svg"
      : item.path.indexOf(":") >= 0
      ? "windows.svg"
      : "shell.svg";
    let data = {
      ...item,
      icon,
    };
    if (isFolder) {
      data.children = this.getServer(item.children);
    }
    return data;
  }
  getChildren(parent) {
    let isShowHost = vscode.workspace
      .getConfiguration("VueDrop")
      .get("showHost.enabled");
    let treeData = !parent ? this.tree : parent.children || [];
    return treeData.map(
      (item) =>
        new TreeNode(
          isShowHost && item.host ? `${item.name}【${item.host}】` : item.name,
          item.icon,
          item.children
            ? vscode.TreeItemCollapsibleState.Collapsed
            : vscode.TreeItemCollapsibleState.None,
          item.children
        )
    );
  }
  getTreeItem(element) {
    return element;
  }
}

module.exports = serverProvider;
