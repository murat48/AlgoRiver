# 🤖 AI Integration Guide

## OpenAI API Entegrasyonu

Bu proje artık gerçek AI API'si ile entegre edilmiştir! OpenAI GPT-4 kullanarak daha akıllı ve kapsamlı yanıtlar alabilirsiniz.

## 🚀 Kurulum

### 1. OpenAI API Key Alın
1. [OpenAI Platform](https://platform.openai.com/api-keys) adresine gidin
2. Hesap oluşturun veya giriş yapın
3. "Create new secret key" butonuna tıklayın
4. API key'inizi kopyalayın

### 2. Environment Variable Ayarlayın

Proje root dizininde `.env` dosyası oluşturun:

```bash
# .env dosyası
VITE_OPENAI_API_KEY=sk-your-actual-api-key-here
```

**Önemli:** API key'inizi asla public repository'de paylaşmayın!

### 3. Projeyi Yeniden Başlatın

```bash
npm run dev
```

## 🎯 Nasıl Çalışır?

### AI vs Fallback Modları

**🟢 AI Aktif Modu:**
- OpenAI GPT-4 kullanır
- Kapsamlı analizler
- Kişiselleştirilmiş yanıtlar
- Gerçek zamanlı blockchain verileri

**🟡 Fallback Modu:**
- Yerel keyword-based yanıtlar
- Hızlı ve güvenilir
- API key olmadan çalışır

### Otomatik Mod Seçimi

AI Chat otomatik olarak hangi modu kullanacağını belirler:

**AI Modu Kullanılır:**
- Uzun mesajlar (>100 karakter)
- Analiz, strateji, tavsiye kelimeleri
- Kapsamlı sorular

**Fallback Modu Kullanılır:**
- Kısa mesajlar (<10 karakter)
- Basit "nedir" soruları
- API key yoksa

## 💡 Test Etmek

### 1. Basit Sorular (Fallback)
```
ALGO nedir?
Staking nedir?
APY nedir?
```

### 2. Kapsamlı Sorular (AI)
```
Portfolyomun risk analizini detaylı yap
Algorand ekosisteminde en iyi yatırım stratejisi nedir?
APY'mi nasıl optimize edebilirim?
```

### 3. Console'da Göreceğiniz Log'lar
```
🚀 Processing message: [mesajınız]
✅ User message added to history
🤖 Using AI API: Yes/No
✅ Real AI response generated: openai/fallback
✅ AI response added to history
```

## 🔧 Konfigürasyon

### AI API Servisi (`aiApiService.ts`)

```typescript
// OpenAI konfigürasyonu
const openai = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true // Vite için gerekli
})

// Model ayarları
model: "gpt-4",
max_tokens: 1000,
temperature: 0.7
```

### Chat Servisi (`aiChatService.ts`)

```typescript
// AI kullanım kriterleri
const useAIKeywords = [
    'analiz', 'analysis', 'değerlendir', 'evaluate',
    'strateji', 'strategy', 'tavsiye', 'recommend'
]
```

## 📊 Özellikler

### ✅ Mevcut Özellikler
- **Hybrid AI System**: AI + Fallback
- **Context Awareness**: Kullanıcı verilerini hatırlar
- **Real-time Status**: AI durumu göstergesi
- **Smart Routing**: Otomatik mod seçimi
- **Error Handling**: Robust hata yönetimi

### 🚀 Gelecek Özellikler
- **Multiple AI Providers**: Claude, Gemini entegrasyonu
- **Custom Models**: Fine-tuned Algorand modeli
- **Voice Interface**: Sesli komutlar
- **Image Analysis**: Grafik analizi

## 🛠️ Troubleshooting

### API Key Hatası
```
❌ OpenAI API key not found, using fallback responses
```
**Çözüm:** `.env` dosyasında `VITE_OPENAI_API_KEY` ayarlayın

### Network Hatası
```
❌ OpenAI API error: Failed to fetch
```
**Çözüm:** İnternet bağlantınızı kontrol edin

### Rate Limit
```
❌ OpenAI API error: Rate limit exceeded
```
**Çözüm:** API kullanımınızı azaltın veya planınızı yükseltin

## 💰 Maliyet

### OpenAI GPT-4 Fiyatlandırması
- **Input**: $0.03 per 1K tokens
- **Output**: $0.06 per 1K tokens
- **Ortalama**: ~$0.01 per mesaj

### Optimizasyon
- Kısa mesajlar için fallback kullanın
- Gereksiz API çağrılarını önleyin
- Token limitlerini ayarlayın

## 🔒 Güvenlik

### API Key Güvenliği
- ✅ Environment variables kullanın
- ✅ `.env` dosyasını `.gitignore`'a ekleyin
- ❌ API key'i kodda hardcode etmeyin
- ❌ Public repository'de paylaşmayın

### Data Privacy
- Kullanıcı verileri OpenAI'ye gönderilir
- Hassas bilgileri paylaşmayın
- GDPR uyumluluğu için gerekli önlemleri alın

## 📈 Performance

### Response Times
- **AI Mode**: 2-5 saniye
- **Fallback Mode**: <1 saniye
- **Cache**: Gelecekte eklenecek

### Optimization Tips
- Kısa ve net sorular sorun
- Gereksiz detayları azaltın
- Context'i optimize edin

---

**🎉 Artık gerçek AI ile konuşabilirsiniz!**

Test etmek için browser'da `http://localhost:5175/` adresine gidin ve AI Chat tab'ını kullanın.
