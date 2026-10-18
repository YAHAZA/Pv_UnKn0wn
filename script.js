(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const deck = document.querySelector('.deck');
  const playerInfo = document.querySelector('.player-info');
  const audio = new Audio();
  audio.preload = 'metadata';
  audio.src = 'assets/let-it-happen.mp3';
  let activeIndex = 0; // 0 = default track, 1+ = user-added tracks
  let tracks = [{ name: 'Let It Happen', artist: 'Tame Impala · Currents', url: 'assets/let-it-happen.mp3', isDefault: true }];
  let surpriseTimer = null, surpriseShown = false, userSeeking = false, currentObjectUrls = [], armTimer = null;
  const formatTime = n => Number.isFinite(n) && n >= 0 ? `${Math.floor(n/60)}:${String(Math.floor(n%60)).padStart(2,'0')}` : '0:00';
  const currentTrack = () => tracks[activeIndex];
  function status(message) { $('playerStatus').textContent = message; }
  function updateTrack() {
    const t = currentTrack();
    $('trackTitle').textContent = t.name;
    $('trackArtist').textContent = t.artist;
    $('recordLabel').textContent = t.name.toUpperCase().slice(0,24);
  }
  function setPlaying(playing) {
    const wasPlaying = deck.classList.contains('is-playing');
    deck.classList.toggle('is-playing', playing);
    if (playing && !wasPlaying) cueTonearm();
    playerInfo.classList.toggle('is-playing', playing);
    $('playBtn').textContent = playing ? 'Ⅱ' : '▶';
    $('playBtn').setAttribute('aria-label', playing ? 'Pause' : 'Play');
    if (playing && !surpriseShown && !surpriseTimer) surpriseTimer = setTimeout(showSurprise, 5000);
    if (!playing && surpriseTimer) { clearTimeout(surpriseTimer); surpriseTimer = null; }
  }
  function cueTonearm() {
    deck.classList.remove('is-returning');
    deck.classList.remove('is-cueing');
    if (armTimer) clearTimeout(armTimer);
    // Lift the stylus, swing the arm over the outer groove, then lower it.
    void $('tonearm').offsetWidth;
    deck.classList.add('is-cueing');
    armTimer = setTimeout(() => { deck.classList.remove('is-cueing'); armTimer = null; }, 2500);
  }
  function returnTonearm() {
    deck.classList.remove('is-cueing');
    if (armTimer) { clearTimeout(armTimer); armTimer = null; }
    deck.classList.add('is-returning');
    setTimeout(() => deck.classList.remove('is-returning'), 1350);
  }
  function showSurprise() {
    surpriseTimer = null;
    surpriseShown = true;
    $('replayHome').hidden = false;
    $('surprise').classList.add('show');
    $('surprise').setAttribute('aria-hidden','false');
  }
  function hideSurprise() {
    $('surprise').classList.remove('show');
    $('surprise').setAttribute('aria-hidden','true');
  }
  function renderQueue() {
    const list = $('queueList');
    list.replaceChildren();
    $('queueCount').textContent = `${String(tracks.length).padStart(2,'0')} TRACK${tracks.length === 1 ? '' : 'S'}`;
    tracks.forEach((t, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'queue-item' + (i === activeIndex ? ' active' : '');
      const n = document.createElement('span'); n.textContent = String(i+1).padStart(2,'0');
      const title = document.createElement('span'); title.textContent = t.name;
      const kind = document.createElement('small'); kind.textContent = t.isDefault ? 'LOCAL FILE' : 'DEVICE';
      b.append(n,title,kind); b.addEventListener('click', () => selectTrack(i, true)); list.append(b);
    });
  }
  function selectTrack(index, autoplay) {
    if (index < 0 || index >= tracks.length) return;
    const wasPlaying = !audio.paused;
    if (surpriseTimer) { clearTimeout(surpriseTimer); surpriseTimer = null; }
    audio.pause(); activeIndex = index; audio.src = currentTrack().url; audio.load();
    updateTrack(); renderQueue();
    $('currentTime').textContent = '0:00'; $('duration').textContent = '0:00'; $('seek').value = '0';
    setPlaying(false);
    status(currentTrack().isDefault
      ? 'DEFAULT TRACK · LOCAL FILE. Press play to start.'
      : 'TRACK SELECTED · LOCAL AUDIO.');
    if (autoplay || wasPlaying) play();
  }
  async function play() {
    try {
      await audio.play();
      setPlaying(true);
      status(`PLAYING · ${currentTrack().name.toUpperCase()}`);
    } catch (err) {
      setPlaying(false);
      if (currentTrack().isDefault) {
        status('DEFAULT AUDIO FILE NOT FOUND. Put your legally obtained MP3 at assets/let-it-happen.mp3, or use “ADD YOUR MUSIC”.');
      } else {
        status('Could not play this file. Try an MP3, M4A, or WAV audio file.');
      }
    }
  }
  function togglePlayback() {
    if (audio.paused) play();
    else { audio.pause(); setPlaying(false); status('PAUSED.'); }
  }
  function stop() {
    audio.pause(); audio.currentTime = 0; setPlaying(false); returnTonearm();
    $('currentTime').textContent = '0:00'; $('seek').value = '0';
    status('STOPPED. PRESS PLAY WHEN YOU ARE READY.');
  }
  function next() { selectTrack((activeIndex + 1) % tracks.length, true); }
  function previous() {
    if (audio.currentTime > 3) { audio.currentTime = 0; return; }
    selectTrack((activeIndex - 1 + tracks.length) % tracks.length, true);
  }
  $('playBtn').addEventListener('click', togglePlayback);
  $('stopBtn').addEventListener('click', stop);
  $('nextBtn').addEventListener('click', next);
  $('prevBtn').addEventListener('click', previous);
  $('chooseMusic').addEventListener('click', () => $('filePicker').click());
  $('filePicker').addEventListener('change', e => {
    const files = Array.from(e.target.files || []).filter(f => f.type.startsWith('audio/'));
    if (!files.length) { status('No audio files selected.'); return; }
    files.forEach(file => {
      const url = URL.createObjectURL(file); currentObjectUrls.push(url);
      tracks.push({ name: file.name.replace(/\.[^.]+$/, '') || file.name, artist: 'Your device · Local audio', url, isDefault: false });
    });
    renderQueue();
    status(`${files.length} TRACK${files.length === 1 ? '' : 'S'} ADDED. Choose one from the queue.`);
    e.target.value = '';
    if (activeIndex === 0 && audio.error) status('Tracks added. Select one from the queue to play.');
  });
  $('volume').addEventListener('input', e => { audio.volume = Number(e.target.value) / 100; });
  $('seek').addEventListener('input', () => {
    userSeeking = true;
    const d = audio.duration || 0;
    $('currentTime').textContent = formatTime(d * Number($('seek').value) / 100);
  });
  $('seek').addEventListener('change', () => {
    if (Number.isFinite(audio.duration) && audio.duration > 0) audio.currentTime = audio.duration * Number($('seek').value) / 100;
    userSeeking = false;
  });
  audio.addEventListener('loadedmetadata', () => { $('duration').textContent = formatTime(audio.duration); });
  audio.addEventListener('timeupdate', () => {
    if (!userSeeking) $('seek').value = audio.duration ? String(audio.currentTime / audio.duration * 100) : '0';
    $('currentTime').textContent = formatTime(audio.currentTime);
  });
  audio.addEventListener('play', () => setPlaying(true));
  audio.addEventListener('pause', () => setPlaying(false));
  audio.addEventListener('ended', () => { setPlaying(false); if (tracks.length > 1) next(); else status('TRACK ENDED. PRESS PLAY TO LISTEN AGAIN.'); });
  audio.addEventListener('error', () => {
    if (currentTrack().isDefault) status('DEFAULT TRACK FILE NOT FOUND. Add assets/let-it-happen.mp3, or select a track with “ADD YOUR MUSIC”.');
    else status('This audio file could not be played. Try another file.');
  });
  $('closeSurprise').addEventListener('click', hideSurprise);
  $('replayHome').addEventListener('click', showSurprise);
  $('menuToggle').addEventListener('click', () => {
    const open = $('nav').classList.toggle('open');
    $('menuToggle').setAttribute('aria-expanded', String(open));
  });
  document.querySelectorAll('#nav a').forEach(a => a.addEventListener('click', () => {
    $('nav').classList.remove('open'); $('menuToggle').setAttribute('aria-expanded','false');
  }));
  window.addEventListener('beforeunload', () => currentObjectUrls.forEach(URL.revokeObjectURL));
  audio.volume = Number($('volume').value) / 100;
  updateTrack(); renderQueue();
  status('DEFAULT TRACK: LET IT HAPPEN. Add assets/let-it-happen.mp3 to enable offline playback.');
})();