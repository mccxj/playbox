class GoProblemsController < ApplicationController
  def index
    # 基础查询：按 ID 倒序（最新的在前）
    @go_problems = GoProblem.order(id: :desc)

    # 可选：支持按类型/段位筛选（后续可扩展搜索功能）
    @go_problems = @go_problems.where(genre: params[:genre]) if params[:genre].present?
    @go_problems = @go_problems.where(rank_unit: params[:rank_unit]) if params[:rank_unit].present?

    # 分页：默认第 1 页，每页 20 条（可通过 params[:page] 切换页码）
    @go_problems = @go_problems.page(params[:page]).per(20)
  end

  def show
    @go_problem = GoProblem.find(params[:id])
  end
end
