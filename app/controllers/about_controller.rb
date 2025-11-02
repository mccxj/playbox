require "sgf"

class AboutController < ApplicationController
  def index
    @go_problem = GoProblem.find(params[:id])
    root = SGF::Parser.new.parse @go_problem.sgf
    print root.gametrees.first
  end
end
