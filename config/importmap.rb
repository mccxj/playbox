# Pin npm packages by running ./bin/importmap

pin "application"
pin "@hotwired/stimulus", to: "stimulus.min.js"
pin "@hotwired/stimulus-loading", to: "stimulus-loading.js"
pin_all_from "app/javascript/controllers", under: "controllers"
pin "components/SGFGameApp", to: "components/SGFGameApp.js"
pin "@hotwired/turbo-rails", to: "turbo.min.js"

pin "@sabaki/shudan", to: "https://esm.sh/@sabaki/shudan@1.7.1/es2022/shudan.mjs"
pin "@sabaki/sgf", to: "https://esm.sh/@sabaki/sgf@3.4.7/es2022/sgf.mjs"
pin "@sabaki/go-board", to: "https://esm.sh/@sabaki/go-board@1.4.3/es2022/go-board.mjs"
pin "preact", to: "https://esm.sh/preact@10.27.2/es2022/preact.mjs"
pin "preact/hooks", to: "https://esm.sh/preact@10.27.2/es2022/hooks.mjs"
