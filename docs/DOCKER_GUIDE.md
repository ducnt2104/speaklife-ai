# 🐳 Hướng dẫn Triển khai SpeakLife AI với Docker

## Yêu cầu
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) đã cài đặt
- Port 3001 chưa bị chiếm

## 📦 Cách 1: Docker Compose (Khuyên dùng)

```bash
# Build và chạy
docker compose up -d --build

# Xem logs
docker compose logs -f

# Dừng
docker compose down
```

## 📦 Cách 2: Docker thủ công

```bash
# Build image
docker build -t speaklife-ai:latest .

# Chạy container
docker run -d \
  --name speaklife-ai-app \
  -p 3001:3001 \
  --env-file .env.local \
  -e NODE_ENV=production \
  -e DATABASE_PATH=/app/data/speaklife.db \
  -v ./data:/app/data \
  --restart unless-stopped \
  speaklife-ai:latest
```

## 🌐 Chia sẻ qua DevTunnel (VS Code)

1. Mở VS Code → Terminal → Tab **Ports**
2. Click **Add Port** → nhập `3001`
3. Click cột **Visibility** → chọn **Public**
4. Copy URL dạng `https://xxxx-3001.asse.devtunnels.ms`
5. Gửi URL cho người khác truy cập

> [!IMPORTANT]
> Server phải đang chạy (localhost:3001) trước khi DevTunnel hoạt động.
> Nếu gặp HTTP 502, kiểm tra server bằng: `curl http://localhost:3001/api/health`

## 🔍 Kiểm tra trạng thái

```bash
# Health check
curl http://localhost:3001/api/health

# Test AI connection
curl -X POST http://localhost:3001/api/ai/test-connection \
  -H "Content-Type: application/json" \
  -d '{"model":"gemini-3.5-flash-lite"}'
```

## ⚠️ Lưu ý quan trọng

- File `.env.local` chứa API Key — **KHÔNG** commit lên Git
- Database SQLite lưu tại `./data/speaklife.db` — volume mount để persist
- DevTunnel Public = bất kỳ ai có URL đều truy cập được
