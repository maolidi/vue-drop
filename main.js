// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const drop = require("./src/composables/useDrop");
const serverProviderClass = require("./src/composables/serverProvider");
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "vue-drop" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with  registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand(
    "vue-drop.drop",
    function (argument) {
      // The code you place here will be executed every time your command is executed
      // Display a message box to the user
      // vscode.window.showInformationMessage("Hello World from Vue Drop!");
      if (argument.contextValue == "serverNode") {
        drop(argument);
      } else {
        vscode.window.showInformationMessage("请选择一个服务器");
      }
    }
  );

  context.subscriptions.push(disposable);
  const serverProvider = new serverProviderClass(context);
  vscode.window.registerTreeDataProvider("server", serverProvider);
  vscode.commands.registerCommand("vue-drop.refresh", () =>
    serverProvider.refresh()
  );
  vscode.commands.registerCommand("vue-drop.config", () => {
    // 打开UI面板
    vscode.commands.executeCommand("workbench.action.openSettings");
    // 打开JSON面板
    // vscode.commands.executeCommand("workbench.action.openSettingsJson");
  });
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
