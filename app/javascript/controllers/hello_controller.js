import { Controller } from "@hotwired/stimulus"

import SGFGameApp from "components/SGFGameApp";
import { h, render } from "preact";

export default class extends Controller {
  static targets = ["root"] 
  static values = { sgf: { type: String, default: "" } }
  connect() {
    console.log("hello_controller: connect method called.");
    console.log("hello_controller: this.rootTarget:", this.rootTarget);
    console.log("hello_controller: typeof this.rootTarget:", typeof this.rootTarget);
    console.log("hello_controller: this.sgfValue:", this.sgfValue);
    console.log("hello_controller: typeof this.sgfValue:", typeof this.sgfValue);
    render(h(SGFGameApp, {sgf: this.sgfValue}), this.rootTarget)
  }
}
