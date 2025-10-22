require "active_record"
require "rest-client"
require "json"
require "pp"
require "openssl"
require "thread"

# 连接 SQLite3 数据库（数据库文件会自动创建）
ActiveRecord::Base.establish_connection(
  adapter: "sqlite3",
  database: "go_problems.db", # 数据库文件名
)

# 定义数据库迁移（创建表结构）
class CreateGoProblems < ActiveRecord::Migration[6.1]
  def change
    create_table :go_problems, if_not_exists: true do |t| # force: true 确保表存在时重建
      t.integer :problem_api_id, null: false, unique: true  # 接口返回的题目ID
      t.text :sgf, null: false                             # SGF内容
      t.string :genre, null: false                         # 题目类型
      t.string :specific_genre                             # 细分类型
      t.integer :problem_level                             # 平台内部难度等级
      t.integer :rank_value                                # 段位数值（如1）
      t.string :rank_unit                                  # 段位单位（如"dan"）
      t.integer :elo                                       # ELO评分
      t.string :author_name                                # 出题人姓名
      t.integer :author_rank_value                         # 出题人段位数值
      t.string :author_rank_unit                           # 出题人段位单位
      t.boolean :is_solved, default: false                 # 是否解答
      t.datetime :created_at, default: -> { "CURRENT_TIMESTAMP" }
      t.datetime :updated_at, default: -> { "CURRENT_TIMESTAMP" }
    end
  end
end

# 执行迁移（创建表）
CreateGoProblems.new.change

# 定义数据模型（与表关联）
class GoProblem < ActiveRecord::Base
  # 自动更新 updated_at 字段
  before_save :update_updated_at

  private

  def update_updated_at
    self.updated_at = Time.now
  end
end

OpenSSL::SSL::VERIFY_PEER = OpenSSL::SSL::VERIFY_NONE

# 获取单题数据
def fetch_problem_data(problem_id)
  api_url = "https://www.goproblems.com/api/v2/problems/#{problem_id}"
  begin
    response = RestClient.get(api_url)
    JSON.parse(response.body)
  rescue RestClient::ExceptionWithResponse => e
    puts "请求失败（状态码：#{e.response.code}）"
    puts "响应内容：#{e.response.body}"
    nil
  rescue JSON::ParserError
    puts "解析失败：响应内容不是有效的JSON"
    nil
  rescue => e
    puts "发生错误：#{e.message}"
    nil
  end
end

# 解析数据并转换为数据库字段格式
def parse_problem_data(raw_data)
  return nil if raw_data.nil?

  {
    problem_api_id: raw_data["id"],
    sgf: raw_data["sgf"] || "",
    genre: raw_data["genre"] || "unknown",
    specific_genre: raw_data["specificGenre"],
    problem_level: raw_data["problemLevel"],
    rank_value: raw_data.dig("rank", "value"),
    rank_unit: raw_data.dig("rank", "unit"),
    elo: raw_data["elo"],
    author_name: raw_data.dig("author", "name"),
    author_rank_value: raw_data.dig("author", "rank", "value"),
    author_rank_unit: raw_data.dig("author", "rank", "unit"),
  }
end

# def save_go_problem(problem_id, extracted)
#   unless extracted.nil?
#     puts "=== 围棋题目信息（ID: #{problem_id}） ==="
#     pp extracted

#     info_file = "temp/problem_#{problem_id}_info.txt"
#     File.write(info_file, extracted.to_json, encoding: "UTF-8")
#     puts "\n信息已保存至：#{info_file}"
#   end
# end

PROBLEM_IDS = (50000...100001).to_a
MAX_THREADS = 40

queue = Queue.new
PROBLEM_IDS.each { |id| queue << id }

results = []
write_mutex = Mutex.new

threads = MAX_THREADS.times.map do
  Thread.new do
    until queue.empty?
      problem_id = queue.pop(true) rescue nil
      next unless problem_id
      next if GoProblem.exists?(problem_api_id: problem_id)

      # 1. 获取原始数据
      raw_data = fetch_problem_data(problem_id)
      next unless raw_data

      # 2. 解析数据
      parsed_data = parse_problem_data(raw_data)
      next unless parsed_data

      # 3. 写入数据库（避免重复插入）
      write_mutex.synchronize do
        begin
          GoProblem.transaction do
            if GoProblem.exists?(problem_api_id: parsed_data[:problem_api_id])
              puts "ID=#{problem_id} 已存在，跳过"
            else
              GoProblem.create!(parsed_data)
              puts "ID=#{problem_id} 写入成功"
            end
          rescue => e
            puts "写入失败：#{e.message}"
          end
        end
      end
      # extracted = get_go_problem(problem_id)
      # save_go_problem(problem_id, extracted)
    end
  end
end

threads.each(&:join)
