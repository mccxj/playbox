require "sqlite3"
require "fileutils"
require "time"

# --- 配置 ---
SOURCE_DB_PATH = "/path/to/your/go_problems.db"
BACKUP_DIR = "/path/to/backup/folder"

# --- 脚本 ---

# 1. 创建带时间戳的备份文件名
timestamp = Time.now.strftime("%Y%m%d_%H%M%S")
backup_file_path = File.join(BACKUP_DIR, "go_problems_#{timestamp}.db")

begin
  # 确保备份目录存在
  FileUtils.mkdir_p(BACKUP_DIR) unless File.directory?(BACKUP_DIR)

  # 2. 连接到源数据库
  source_db = SQLite3::Database.new(SOURCE_DB_PATH)

  # 3. 创建目标连接（目标文件不存在则自动创建）
  # 注意：在 Ruby 的 SQLite3 gem 中，备份通常是通过执行 SQL 或特定方法来完成的。
  # 实际上，你可以使用 source_db.backup(dest_filename) 或者直接使用 Shell 命令。

  # 检查 SQLite 版本是否支持 VACUUM INTO
  if source_db.get_first_value("SELECT sqlite_version()") >= "3.7.11"
    source_db.execute("VACUUM INTO '#{backup_file_path}'")
  else
    system("sqlite3 #{SOURCE_DB_PATH.shellescape} '.backup #{backup_file_path.shellescape}'")
  end

  # 备份后添加验证
  if File.exist?(backup_file_path) && File.size(backup_file_path) > 0
    puts "备份成功: #{backup_file_path}"
  else
    raise "备份文件无效或为空"
  end
rescue SQLite3::Exception => e
  puts "SQLite 备份失败: #{e.message}"
rescue StandardError => e
  puts "发生错误: #{e.message}"
ensure
  # 4. 关闭连接
  source_db.close if source_db
end

# --- 可选：清理旧备份的函数 ---
def cleanup_old_backups(dir, max_days = 7)
  # 清理逻辑：查找目录下所有 go_problems_*.db 文件，删除超过 max_days 的文件
  puts "开始清理超过 #{max_days} 天的旧备份..."
  Dir.glob(File.join(dir, "go_problems_*.db")).each do |file|
    if File.mtime(file) < (Time.now - max_days * 24 * 60 * 60)
      File.delete(file)
      puts "已删除旧备份: #{file}"
    end
  end
end

# 运行清理
# cleanup_old_backups(BACKUP_DIR, 7)
