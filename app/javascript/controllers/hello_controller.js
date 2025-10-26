import { Controller } from "@hotwired/stimulus"

import SGFGameApp from "components/SGFGameApp";
import { h, render } from "preact";

export default class extends Controller {
  static targets = ["root"] 
  static values = { sgf: { type: String, default: "" } }
  connect() {
    render(h(SGFGameApp, {sgf: this.sgfValue}), this.rootTarget)
  }
}
