"use strict";
(self["webpackChunk_jupyterlab_examples_commands"] = self["webpackChunk_jupyterlab_examples_commands"] || []).push([["lib_index_js"],{

/***/ "./lib/index.js":
/*!**********************!*\
  !*** ./lib/index.js ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
//import DockPanel from '@lumino/widgets'
/**
 * Initialization data for the commands example.
 */
const extension = {
    id: 'commands',
    autoStart: true,
    activate: (app) => {
        const { commands } = app;
        const command = 'jlab-examples:command';
        // Add a command
        commands.addCommand(command, {
            label: 'Execute jlab-examples:command Command',
            caption: 'Execute jlab-examples:command Command',
            execute: (args) => {
                const orig = args['origin'];
                console.log(`jlab-examples:command has been called from ${orig}. coool!`);
                if (orig !== 'init') {
                    window.alert(`jlab-examples:command has been called from ${orig}.`);
                }
                // simpleMode + presentationMode by default.
                setTimeout(function () {
                    console.log(`it Works`);
                    const simpleMode = 'single-document';
                    commands.execute('application:set-mode', { mode: simpleMode });
                    console.log(`it Works - 2`);
                }, 2000);
            },
        });
        // Call the command execution
        commands.execute(command, { origin: 'init' }).catch((reason) => {
            console.error(`An error occurred during the execution of jlab-examples:command.\n${reason}`);
        });
    },
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (extension);


/***/ })

}]);
//# sourceMappingURL=lib_index_js.2df39ac2768cc5bf3354.js.map