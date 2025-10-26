class GoProblem < ActiveRecord::Base
  # 自动更新 updated_at 字段
  before_save :update_updated_at

  private

  def update_updated_at
    self.updated_at = Time.now
  end
end
