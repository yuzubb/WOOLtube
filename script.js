let currentVideoId = null;
let availableStreams = [];
let currentPlayMode = 'embed';
let debugMessages = [];

function addDebug(msg) {
    debugMessages.push(`[${new Date().toLocaleTimeString()}] ${msg}`);
    const debugLog = document.getElementById('debugLog');
    if (debugLog) {
        debugLog.style.display = 'block';
        debugLog.innerHTML = debugMessages.slice(-15).join('<br>');
    }
    console.log(msg);
}

// 大幅に拡充したCORSプロキシ設定（20種類以上）
const CORS_PROXIES = [
    // AllOrigins系
    'https://api.allorigins.win/raw?url=',
    'https://api.allorigins.win/get?url=',

    // CORS Anywhere系
    'https://corsproxy.io/?',
    'https://cors-anywhere.herokuapp.com/',

    // CodeTabs系
    'https://api.codetabs.com/v1/proxy?quest=',

    // ThingProxy
    'https://thingproxy.freeboard.io/fetch/',

    // CORS.SH
    'https://cors.sh/',

    // Crossorigin.me
    'https://crossorigin.me/',

    // YACD (Yet Another CORS Proxy)
    'https://yacd.hacker.af/cors/',

    // Workers Dev (Cloudflare Workers)
    'https://cors-proxy.fringe.zone/cors?url=',
    'https://cors.bridged.cc/',

    // JSON-P系
    'https://jsonp.afeld.me/?url=',

    // Codetabs alternative
    'https://api.codetabs.com/v1/proxy/?quest=',

    // Other public proxies
    'https://proxy.cors.sh/',
    'https://api.1pt.co/api/v1/proxy?url=',

    // European servers
    'https://cors-eu.herokuapp.com/',
    'https://cors.eu.org/',

    // Asian servers
    'https://cors-asia.herokuapp.com/',

    // US servers
    'https://cors-us.herokuapp.com/',

    // Additional reliable proxies
    'https://api.proxyscrape.com/v2/?request=proxy&url=',
    'https://proxy.techzbots1.workers.dev/?u=',
    'https://test-cors.org/',

    // Backup proxies
    'https://cors-fetch.browserslist.workers.dev/?url=',
    'https://api.scraperapi.com/?api_key=demo&url='
];

let currentProxyIndex = 0;

function getProxiedUrl(url) {
    const proxy = CORS_PROXIES[currentProxyIndex];
    return `${proxy}${encodeURIComponent(url)}`;
}

function rotateProxy() {
    currentProxyIndex = (currentProxyIndex + 1) % CORS_PROXIES.length;
    addDebug(`🔄 プロキシ切り替え [${currentProxyIndex + 1}/${CORS_PROXIES.length}]: ${CORS_PROXIES[currentProxyIndex].substring(0, 50)}...`);
}

// ⬇️ ここから Invidious API のみに変更 ⬇️
const streamAPIs = [
    {
        name: 'Invidious',
        servers: [
            'https://nyc1.iv.ggtyler.dev',
            'https://invid-api.poketube.fun',
            'https://cal1.iv.ggtyler.dev',
            'https://invidious.nikkosphere.com',
            'https://lekker.gay',
            'https://invidious.f5.si',
            'https://invidious.lunivers.trade',
            'https://pol1.iv.ggtyler.dev',
            'https://eu-proxy.poketube.fun',
            'https://iv.melmac.space',
            'https://invidious.reallyaweso.me',
            'https://invidious.dhusch.de',
            'https://usa-proxy2.poketube.fun',
            'https://id.420129.xyz',
            'https://invidious.darkness.service',
            'https://iv.datura.network',
            'https://invidious.jing.rocks',
            'https://invidious.private.coffee',
            'https://youtube.mosesmang.com',
            'https://iv.duti.dev',
            'https://invidious.projectsegfau.lt',
            'https://invidious.perennialte.ch',
            'https://invidious.einfachzocken.eu',
            'https://invidious.adminforge.de',
            'https://inv.nadeko.net',
            'https://invidious.esmailelbob.xyz',
            'https://invidious.0011.lt',
            'https://invidious.ducks.party',
            'https://invidious.fdn.fr',
            'https://invidious.privacydev.net',
            'https://iv.nboeck.de',
            'https://invidious.protokolla.fi',
            'https://invidious.slipfox.xyz',
            'https://inv.bp.projectsegfau.lt',
            'https://yt.artemislena.eu',
            'https://invidious.flokinet.to',
            'https://invidious.kavin.rocks',
            'https://vid.puffyan.us',
            'https://inv.riverside.rocks',
            'https://invidious.tiekoetter.com',
            'https://inv.vern.cc',
            'https://invidious.nerdvpn.de',
            'https://inv.us.projectsegfau.lt',
            'https://invidious.lunar.icu',
            'https://inv.in.projectsegfau.lt',
            'https://yt.drgnz.club',
            'https://inv.tux.pizza',
            'https://iv.ggtyler.dev',
            'https://inv.citw.lgbt',
            'https://inv.odyssey346.dev',
            'https://yewtu.be',
            'https://invidious.snopyta.org',
            'https://vid.mint.lgbt',
            'https://invidious.sethforprivacy.com',
            'https://invidious.namazso.eu'
        ],
        getUrl: (server, videoId) => `${server}/api/v1/videos/${videoId}`,
        parseResponse: (data) => {
            const streams = [];

            if (data.formatStreams && data.formatStreams.length > 0) {
                data.formatStreams.forEach(s => {
                    if (s.url) {
                        streams.push({
                            url: s.url,
                            quality: s.qualityLabel || s.quality || 'unknown',
                            type: 'Invidious',
                            hasAudio: true
                        });
                    }
                });
            }

            if (data.adaptiveFormats && data.adaptiveFormats.length > 0) {
                data.adaptiveFormats.forEach(s => {
                    if (s.url && s.type && s.type.includes('video')) {
                        streams.push({
                            url: s.url,
                            quality: s.qualityLabel || 'auto',
                            type: 'Invidious',
                            hasAudio: false
                        });
                    }
                });
            }

            return streams;
        }
    }
];

// ⬆️ ここまで Invidious API のみに変更 ⬆️

function toggleTheme() {
    const body = document.body;
    const themeToggle = document.getElementById('themeToggle');

    body.classList.toggle('light-mode');

    if (body.classList.contains('light-mode')) {
        themeToggle.textContent = '☀️';
    } else {
        themeToggle.textContent = '🌙';
    }
}

async function searchVideos() {
    const query = document.getElementById('searchQuery').value.trim();
    const apiKey = document.getElementById('apiKey').value.trim();
    const loading = document.getElementById('loading');
    const error = document.getElementById('error');
    const info = document.getElementById('info');
    const results = document.getElementById('results');

    error.style.display = 'none';
    info.style.display = 'none';
    results.innerHTML = '';

    if (!query) {
        showError('検索キーワードまたはURLを入力してください');
        return;
    }

    const videoIdMatch = query.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    if (videoIdMatch) {
        playVideo(videoIdMatch[1], 'YouTube動画');
        return;
    }

    loading.style.display = 'block';
    showInfo('検索中...');

    if (apiKey) {
        try {
            const response = await fetch(
                `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=12&q=${encodeURIComponent(query)}&type=video&key=${apiKey}`,
                { signal: AbortSignal.timeout(10000) }
            );

            if (response.ok) {
                const data = await response.json();
                if (data.items && data.items.length > 0) {
                    displayGoogleResults(data.items);
                    loading.style.display = 'none';
                    showInfo('Google YouTube Data API で検索しました');
                    return;
                }
            }
        } catch (err) {
            console.log('Google API error:', err);
        }
    }

    showError('検索に失敗しました。YouTube URLを直接入力するか、Google API Keyを入力してみてください。');
    loading.style.display = 'none';
}

function displayGoogleResults(items) {
    const results = document.getElementById('results');

    items.forEach(item => {
        const videoId = item.id.videoId;
        const card = document.createElement('div');
        card.className = 'video-card';
        card.onclick = () => playVideo(videoId, item.snippet.title);

        const thumbnail = item.snippet.thumbnails.medium.url;

        card.innerHTML = `
            <img src="${thumbnail}" alt="${item.snippet.title}">
            <div class="video-info">
                <div class="video-title">${item.snippet.title}</div>
                <div class="video-channel">${item.snippet.channelTitle}</div>
            </div>
        `;

        results.appendChild(card);
    });
}

function playVideo(videoId, title) {
    const playerSection = document.getElementById('playerSection');
    const currentVideo = document.getElementById('currentVideo');
    const btnStream = document.getElementById('btnStream');

    currentVideoId = videoId;
    availableStreams = [];
    debugMessages = [];

    addDebug(`🎬 動画ID: ${videoId}`);
    addDebug(`📝 タイトル: ${title}`);

    playerSection.style.display = 'block';
    currentVideo.textContent = title;

    const playerContainer = document.getElementById('playerContainer');
    playerContainer.innerHTML = `<iframe id="player" width="100%" height="100%" src="https://www.youtube.com/embed/${videoId}?autoplay=1" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;

    const streamUrl = document.getElementById('streamUrl');
    streamUrl.textContent = `埋め込み再生中 | https://www.youtube.com/watch?v=${videoId}`;

    addDebug('✅ 埋め込みプレーヤー作成完了');

    btnStream.disabled = true;
    btnStream.textContent = '🎬 取得中...';

    addDebug('🔍 ストリーム情報の取得を開始...');
    addDebug(`📊 利用可能プロキシ数: ${CORS_PROXIES.length}`);

    fetchStreamUrls(videoId).then(streams => {
        if (streams.length > 0) {
            availableStreams = streams;
            btnStream.disabled = false;
            btnStream.textContent = '🎬 ストリーム再生';
            addDebug(`✅ ${streams.length}個のストリームを取得成功！`);
            addDebug(`📊 API: ${streams[0].type}`);
            addDebug(`🎚️ 画質: ${streams.map(s => s.quality).join(', ')}`);
            showInfo(`ストリーム再生が利用可能です（${streams[0].type}）`);
        } else {
            btnStream.disabled = true;
            btnStream.textContent = '🎬 利用不可';
            addDebug('❌ ストリーム取得失敗');
            addDebug('💡 埋め込み再生をご利用ください');
        }
    }).catch(err => {
        addDebug(`❌ エラー: ${err.message}`);
        btnStream.disabled = true;
        btnStream.textContent = '🎬 エラー';
    });

    playerSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function fetchStreamUrls(videoId) {
    let attemptCount = 0;
    const maxAttempts = streamAPIs.reduce((sum, api) => sum + api.servers.length, 0);

    addDebug(`🌐 ${maxAttempts}個のエンドポイントを試行`);
    addDebug(`🔄 プロキシローテーション有効（${CORS_PROXIES.length}個）`);

    for (const api of streamAPIs) {
        addDebug(`\n📡 ${api.name} API (${api.servers.length}サーバー)`);

        for (const server of api.servers) {
            attemptCount++;
            let proxyAttempts = 0;
            const maxProxyAttempts = Math.min(3, CORS_PROXIES.length);

            while (proxyAttempts < maxProxyAttempts) {
                try {
                    addDebug(`  [${attemptCount}/${maxAttempts}] ${server.replace('https://', '')} (プロキシ試行: ${proxyAttempts + 1}/${maxProxyAttempts})`);

                    let response;

                    if (api.customFetch) {
                        response = await api.customFetch(server, videoId);
                    } else {
                        const apiUrl = api.getUrl(server, videoId);
                        const proxiedUrl = getProxiedUrl(apiUrl);

                        response = await fetch(proxiedUrl, {
                            signal: AbortSignal.timeout(8000)
                        });
                    }

                    addDebug(`    → HTTP ${response.status}`);

                    if (!response.ok) {
                        if (proxyAttempts < maxProxyAttempts - 1) {
                            rotateProxy();
                            proxyAttempts++;
                            continue;
                        }
                        break;
                    }

                    const contentType = response.headers.get('content-type');
                    let data;

                    if (contentType && contentType.includes('application/json')) {
                        data = await response.json();
                    } else {
                        data = await response.text();
                    }

                    addDebug(`    → データ取得成功`);

                    const streams = api.parseResponse(data);

                    if (streams.length > 0) {
                        addDebug(`    ✅ ${streams.length}個のストリーム取得！`);
                        streams.slice(0, 3).forEach((s, i) => {
                            addDebug(`      [${i+1}] ${s.quality} ${s.hasAudio ? '🔊' : '🔇'}`);
                        });
                        return streams;
                    } else {
                        addDebug(`    ⚠️ ストリーム0個`);
                        if (proxyAttempts < maxProxyAttempts - 1) {
                            rotateProxy();
                            proxyAttempts++;
                            continue;
                        }
                    }
                    break;
                } catch (err) {
                    if (err.name === 'AbortError') {
                        addDebug(`    ⏱️ タイムアウト(8秒)`);
                    } else {
                        addDebug(`    ❌ ${err.message}`);
                    }

                    if (proxyAttempts < maxProxyAttempts - 1) {
                        rotateProxy();
                        proxyAttempts++;
                        continue;
                    }
                    break;
                }
            }
        }
    }

    addDebug('\n❌ すべてのAPIで失敗しました');
    addDebug(`📊 試行統計: ${attemptCount}回試行, ${CORS_PROXIES.length}個のプロキシ利用`);
    return [];
}

function setPlayMode(mode) {
    if (!currentVideoId) {
        addDebug('❌ 動画IDがありません');
        return;
    }

    currentPlayMode = mode;
    const playerContainer = document.getElementById('playerContainer');
    const streamUrl = document.getElementById('streamUrl');
    const qualityControls = document.getElementById('qualityControls');

    streamUrl.textContent = '';
    qualityControls.style.display = 'none';

    addDebug(`\n🎮 再生モード切り替え: ${mode}`);

    if (mode === 'stream') {
        if (availableStreams.length === 0) {
            showError('ストリーム情報が取得できていません');
            addDebug('❌ ストリーム情報なし');
            return;
        }

        addDebug(`📺 video要素を作成`);
        playerContainer.innerHTML = '<video id="player" controls autoplay style="width:100%;height:100%;"></video>';
        qualityControls.style.display = 'flex';
        changeQuality('best');
        return;
    }

    addDebug(`📺 iframe埋め込みを作成: ${mode}`);

    let embedUrl = '';

    if (mode === 'embed') {
        embedUrl = `https://www.youtube.com/embed/${currentVideoId}?autoplay=1`;
        streamUrl.textContent = `埋め込み再生 | https://www.youtube.com/watch?v=${currentVideoId}`;
    } else if (mode === 'nocookie') {
        embedUrl = `https://www.youtube-nocookie.com/embed/${currentVideoId}?autoplay=1`;
        streamUrl.textContent = `No Cookie埋め込み | プライバシー重視`;
    } else if (mode === 'education') {
        const eduParams = [
            'autoplay=1',
            'mute=0',
            'controls=1',
            'start=0',
            'playsinline=1',
            'showinfo=0',
            'rel=0',
            'iv_load_policy=3',
            'modestbranding=1',
            'fs=1',
            'cc_load_policy=0',
            'enablejsapi=1'
        ].join('&');
        embedUrl = `https://www.youtube.com/embed/${currentVideoId}?${eduParams}`;
        streamUrl.textContent = `Education埋め込み | 教育プラットフォーム向け設定`;
    }

    playerContainer.innerHTML = `<iframe id="player" width="100%" height="100%" src="${embedUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;

    addDebug(`✅ 埋め込み完了: ${embedUrl}`);
}

function changeQuality(qualityLevel) {
    if (availableStreams.length === 0) return;

    const player = document.getElementById('player');
    const streamUrl = document.getElementById('streamUrl');

    addDebug(`\n🎚️ 画質変更: ${qualityLevel}`);

    const audioStreams = availableStreams.filter(s => s.hasAudio);
    const sortableStreams = audioStreams.length > 0 ? audioStreams : availableStreams;

    addDebug(`音声付き: ${audioStreams.length}個, 全体: ${availableStreams.length}個`);

    let selectedStream;

    const sortedStreams = [...sortableStreams].sort((a, b) => {
        const getQualityValue = (q) => {
            const match = String(q).match(/(\d+)/);
            return match ? parseInt(match[1]) : 0;
        };
        return getQualityValue(b.quality) - getQualityValue(a.quality);
    });

    addDebug(`利用可能な画質: ${sortedStreams.map(s => s.quality).join(', ')}`);

    switch(qualityLevel) {
        case 'best':
            selectedStream = sortedStreams[0];
            break;
        case 'high':
            selectedStream = sortedStreams.find(s => {
                const q = String(s.quality);
                return q.includes('720') || q.includes('480');
            }) || sortedStreams[Math.floor(sortedStreams.length / 2)];
            break;
        case 'medium':
            selectedStream = sortedStreams.find(s => {
                const q = String(s.quality);
                return q.includes('360') || q.includes('240');
            }) || sortedStreams[sortedStreams.length - 1];
            break;
    }

    if (selectedStream && selectedStream.url) {
        addDebug(`✅ 選択: ${selectedStream.quality} (${selectedStream.hasAudio ? '音声あり' : '音声なし'})`);
        addDebug(`🔗 URL: ${selectedStream.url.substring(0, 80)}...`);

        player.src = selectedStream.url;
        player.play().then(() => {
            addDebug('▶️ 再生開始');
        }).catch(e => {
            addDebug(`❌ 再生エラー: ${e.message}`);
            showError('ストリームの再生に失敗しました');
        });
        streamUrl.textContent = `画質: ${selectedStream.quality} | API: ${selectedStream.type} ${selectedStream.hasAudio ? '🔊' : '🔇'}`;
    } else {
        addDebug('❌ ストリームの選択に失敗');
        showError('ストリームの読み込みに失敗しました');
    }
}

async function downloadVideo(type) {
    if (!currentVideoId) {
        showError('動画が選択されていません');
        return;
    }

    addDebug(`\n📥 ダウンロード開始: ${type}`);

    const btnDownloadVideo = document.getElementById('btnDownloadVideo');
    const btnDownloadAudio = document.getElementById('btnDownloadAudio');

    btnDownloadVideo.disabled = true;
    btnDownloadAudio.disabled = true;
    btnDownloadVideo.textContent = '⏳ 処理中...';
    btnDownloadAudio.textContent = '⏳ 処理中...';

    try {
        let downloadUrl = null;

        if (availableStreams.length > 0) {
            addDebug('🔍 取得済みストリームURLを使用');
            const stream = availableStreams.find(s => s.hasAudio) || availableStreams[0];
            if (stream) {
                downloadUrl = stream.url;
                addDebug(`✅ ストリームURL使用: ${stream.quality}`);
            }
        }

        if (!downloadUrl) {
            addDebug('🔍 新規取得を試行');
            const streams = await fetchStreamUrls(currentVideoId);
            if (streams.length > 0) {
                const stream = streams.find(s => s.hasAudio) || streams[0];
                downloadUrl = stream.url;
                addDebug(`✅ 新規URL取得: ${stream.quality}`);
            }
        }

        if (downloadUrl) {
            addDebug('📥 ダウンロード開始...');

            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `${currentVideoId}.${type === 'audio' ? 'mp3' : 'mp4'}`;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';

            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            showInfo(`${type === 'video' ? '動画' : '音声'}のダウンロードを開始しました`);
            addDebug('✅ ダウンロードリンククリック完了');
        } else {
            throw new Error('ダウンロードURLの取得に失敗しました');
        }
    } catch (err) {
        addDebug(`❌ ダウンロード失敗: ${err.message}`);
        showError('ダウンロードに失敗しました。ストリーム再生をお試しください。');
    } finally {
        btnDownloadVideo.disabled = false;
        btnDownloadAudio.disabled = false;
        btnDownloadVideo.textContent = '📥 動画DL';
        btnDownloadAudio.textContent = '🎵 音声DL';
    }
}

function showError(message) {
    const error = document.getElementById('error');
    error.textContent = message;
    error.style.display = 'block';
    setTimeout(() => {
        error.style.display = 'none';
    }, 5000);
}

function showInfo(message) {
    const info = document.getElementById('info');
    info.textContent = message;
    info.style.display = 'block';
    setTimeout(() => {
        info.style.display = 'none';
    }, 3000);
}
