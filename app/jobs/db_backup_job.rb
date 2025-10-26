class DbBackupJob < ApplicationJob
  queue_as :default
  # 遇到临时错误（如数据库锁定）时重试，最多 3 次
  retry_on SQLite3::BusyException, wait: 10.seconds, attempts: 3
  retry_on StandardError, wait: 1.minute, attempts: 2

  def perform
    # 配置路径（基于 Rails 项目根目录）
    source_db_path = Rails.root.join("storage", "go_problems.db")  # 源数据库路径
    backup_dir = Rails.root.join("backups", "db")                 # 备份目录

    # 1. 验证源数据库是否存在
    unless File.exist?(source_db_path)
      raise "源数据库不存在：#{source_db_path}"
    end

    # 2. 创建带时间戳的备份文件名
    timestamp = Time.now.strftime("%Y%m%d_%H%M%S")
    backup_file_path = backup_dir.join("go_problems_#{timestamp}.db")

    begin
      # 确保备份目录存在
      FileUtils.mkdir_p(backup_dir) unless File.directory?(backup_dir)
      Rails.logger.info "开始备份数据库：#{source_db_path} → #{backup_file_path}"

      # 3. 连接源数据库并执行备份
      source_db = SQLite3::Database.new(source_db_path.to_s)

      # 检查 SQLite 版本，选择备份方式
      if source_db.get_first_value("SELECT sqlite_version()") >= "3.7.11"
        source_db.execute("VACUUM INTO '#{backup_file_path}'")
      else
        # 使用系统命令备份（兼容旧版本 SQLite）
        system("sqlite3 #{source_db_path.shellescape} '.backup #{backup_file_path.shellescape}'")
      end

      # 4. 验证备份文件有效性
      validate_backup(backup_file_path)
      Rails.logger.info "备份成功：#{backup_file_path}"

      # 5. 清理旧备份（保留最近 7 天）
      cleanup_old_backups(backup_dir, max_days: 7)

    rescue SQLite3::Exception => e
      Rails.logger.error "SQLite 备份失败：#{e.message}"
      raise  # 触发重试机制
    rescue StandardError => e
      Rails.logger.error "备份失败：#{e.message}"
      raise
    ensure
      source_db.close if source_db
    end
  end

  private

  # 验证备份文件是否有效
  def validate_backup(backup_file_path)
    unless File.exist?(backup_file_path)
      raise "备份文件未生成：#{backup_file_path}"
    end

    if File.size(backup_file_path) <= 0
      File.delete(backup_file_path) if File.exist?(backup_file_path)
      raise "备份文件为空：#{backup_file_path}"
    end
  end

  # 清理旧备份
  def cleanup_old_backups(dir, max_days:)
    Rails.logger.info "开始清理超过 #{max_days} 天的旧备份（目录：#{dir}）"
    cutoff_time = Time.now - max_days * 24 * 60 * 60

    Dir.glob(File.join(dir, "go_problems_*.db")).each do |file|
      if File.mtime(file) < cutoff_time
        File.delete(file)
        Rails.logger.info "已删除旧备份：#{file}"
      end
    end
  end
end
