require "nokogiri"
require "httparty"

# get the target page
response = HTTParty.get("https://brightdata.com/", {
  headers: {
    "User-Agent" => "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36",
  },
})

doc = Nokogiri::HTML(response.body)
