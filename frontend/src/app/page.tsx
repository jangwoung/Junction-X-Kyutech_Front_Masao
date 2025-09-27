"use client";

export default function Home() {
  return (
    <div className="min-h-screen w-full">
      <div className="p-4">
        <a
          href="/home"
          className="inline-block rounded bg-indigo-600 px-3 py-2 text-white"
        >
          Home
        </a>
      </div>

      {/* PWA設定説明 */}
      <div className="p-4 bg-gray-900 text-white">
        <h2 className="text-xl font-bold mb-4">🚀 PWA設定方法</h2>
        <div className="space-y-4 text-sm">
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-400 mb-2">
              📱 スマートフォンでのインストール
            </h3>
            <div className="space-y-2">
              <p>
                <strong>Android (Chrome):</strong>
              </p>
              <ol className="list-decimal list-inside ml-4 space-y-1">
                <li>Chromeブラウザでこのページを開く</li>
                <li>アドレスバーの右側にある「インストール」ボタンをタップ</li>
                <li>「インストール」を確認</li>
                <li>ホーム画面にアプリアイコンが追加されます</li>
              </ol>
            </div>
            <div className="space-y-2 mt-3">
              <p>
                <strong>iPhone (Safari):</strong>
              </p>
              <ol className="list-decimal list-inside ml-4 space-y-1">
                <li>Safariブラウザでこのページを開く</li>
                <li>画面下部の「共有」ボタンをタップ</li>
                <li>「ホーム画面に追加」を選択</li>
                <li>「追加」をタップして確認</li>
                <li>ホーム画面にアプリアイコンが追加されます</li>
              </ol>
            </div>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="font-semibold text-green-400 mb-2">
              💻 デスクトップでのインストール
            </h3>
            <div className="space-y-2">
              <p>
                <strong>Chrome/Edge:</strong>
              </p>
              <ol className="list-decimal list-inside ml-4 space-y-1">
                <li>ブラウザでこのページを開く</li>
                <li>
                  アドレスバーの右側にある「インストール」アイコンをクリック
                </li>
                <li>「インストール」をクリック</li>
                <li>アプリが新しいウィンドウで起動します</li>
              </ol>
            </div>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="font-semibold text-yellow-400 mb-2">✨ PWA機能</h3>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>
                オフライン対応 - インターネット接続なしでも基本機能が利用可能
              </li>
              <li>ネイティブアプリのような体験 - フルスクリーン表示</li>
              <li>ホーム画面からの直接起動</li>
              <li>プッシュ通知対応（将来実装予定）</li>
              <li>高速起動 - キャッシュされたリソースを使用</li>
            </ul>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-400 mb-2">
              🔧 開発者向け情報
            </h3>
            <div className="space-y-2 text-xs">
              <p>
                <strong>Service Worker:</strong> 自動的に生成・登録されます
              </p>
              <p>
                <strong>Manifest:</strong> /manifest.json で設定
              </p>
              <p>
                <strong>アイコン:</strong> /public/icons/ に配置
              </p>
              <p>
                <strong>キャッシュ戦略:</strong> next-pwa が自動管理
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
