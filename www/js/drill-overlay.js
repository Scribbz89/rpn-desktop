// Floating drill overlay — shows on every page when a drill is active.
// Hidden on drill-run.html itself (full UI already visible there).

(function() {
    if (window.location.pathname.indexOf('drill-run.html') !== -1) return;

    var _expanded = false;
    var _timerInterval = null;

    function getDrill() {
        try { return JSON.parse(localStorage.getItem('rpn_active_drill') || 'null'); }
        catch(e) { return null; }
    }

    function saveDrill(d) {
        localStorage.setItem('rpn_active_drill', JSON.stringify(d));
    }

    function clearDrill() {
        localStorage.removeItem('rpn_active_drill');
    }

    function formatTime(s) {
        var m = Math.floor(s / 60);
        var sec = s % 60;
        return m + ':' + (sec < 10 ? '0' : '') + sec;
    }

    function elapsedSecs(d) {
        if (!d.startTimestamp) return d.timerSecs || 0;
        return Math.floor((Date.now() - d.startTimestamp) / 1000);
    }

    function currentStepIdx(d) {
        var checked = d.checked || [];
        for (var i = 0; i < d.steps.length; i++) {
            if (checked.indexOf(i) === -1) return i;
        }
        return d.steps.length;
    }

    function inject() {
        if (document.getElementById('rpn-drill-overlay')) return;

        var el = document.createElement('div');
        el.id = 'rpn-drill-overlay';
        el.style.cssText = [
            'position:fixed', 'left:0', 'right:0', 'bottom:60px',
            'z-index:7500', 'pointer-events:none',
        ].join(';');
        document.body.appendChild(el);

        var style = document.createElement('style');
        style.textContent = [
            '#rpn-drill-bar{pointer-events:all;background:#0f1a0f;border-top:2px solid #6dbf5a;box-shadow:0 -4px 20px rgba(0,0,0,0.6);}',
            '#rpn-drill-collapsed{display:flex;align-items:center;gap:10px;padding:10px 14px;cursor:pointer;user-select:none;}',
            '#rpn-drill-expanded{padding:14px 16px;border-top:1px solid #1a2a1a;}',
            '.drill-ov-btn{flex:1;padding:11px;border-radius:7px;font-size:13px;font-weight:700;border:none;cursor:pointer;font-family:inherit;}',
        ].join('');
        document.head.appendChild(style);

        render();
    }

    function render() {
        var d = getDrill();
        var el = document.getElementById('rpn-drill-overlay');
        if (!el) return;

        if (!d) { el.innerHTML = ''; stopTimer(); return; }

        var checked = d.checked || [];
        var total = d.steps.length;
        var done = checked.length;
        var nextIdx = currentStepIdx(d);
        var secs = elapsedSecs(d);
        var pct = total > 0 ? Math.round(done / total * 100) : 0;

        var collapsedHtml = '<div id="rpn-drill-collapsed" onclick="drillOverlayToggle()">'
            + '<span style="color:#c0392b;font-size:14px;font-weight:700;">&#9679;</span>'
            + '<span style="flex:1;font-size:13px;font-weight:700;color:#d4d9d4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'
            + (d.drillName || 'Drill') + '</span>'
            + '<span style="font-size:12px;color:#7a8f78;white-space:nowrap;">' + done + '/' + total + ' steps &middot; ' + formatTime(secs) + '</span>'
            + '<span style="color:#6dbf5a;font-size:16px;margin-left:8px;">' + (_expanded ? '&#9660;' : '&#9650;') + '</span>'
            + '</div>';

        var expandedHtml = '';
        if (_expanded) {
            var stepText = nextIdx < total ? d.steps[nextIdx] : 'All steps complete';
            var timerCol = secs > (d.targetTime||600) * 1.2 ? '#c0392b' : secs > (d.targetTime||600) ? '#d4a017' : '#6dbf5a';

            expandedHtml = '<div id="rpn-drill-expanded">'
                + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">'
                + '<span style="font-size:11px;color:#7a8f78;text-transform:uppercase;letter-spacing:1px;">'
                + (nextIdx < total ? 'Step ' + (nextIdx+1) + ' of ' + total : 'Complete') + '</span>'
                + '<span style="font-size:16px;font-weight:700;font-family:monospace;color:' + timerCol + ';">' + formatTime(secs) + '</span>'
                + '</div>'
                + '<div style="background:#1a2a1a;border-radius:4px;height:4px;overflow:hidden;margin-bottom:12px;">'
                + '<div style="height:100%;width:' + pct + '%;background:#6dbf5a;border-radius:4px;"></div>'
                + '</div>'
                + '<div style="font-size:14px;color:#d4d9d4;line-height:1.6;margin-bottom:14px;padding:12px;background:#131f13;border:1px solid #2a4a2a;border-radius:8px;">'
                + (nextIdx < total ? escOverlay(stepText) : '&#10003; All steps done')
                + '</div>'
                + '<div style="display:flex;gap:8px;margin-bottom:10px;">'
                + (nextIdx < total
                    ? '<button class="drill-ov-btn" style="background:#2a4a1a;color:#6dbf5a;" onclick="drillOverlayDone()">&#10003; Done &mdash; next step</button>'
                    : '<button class="drill-ov-btn" style="background:#2a4a1a;color:#6dbf5a;" onclick="drillOverlayFinish()">&#10003; Finish drill</button>')
                + '</div>'
                + '<div style="display:flex;gap:8px;">'
                + '<a href="drill-run.html?id=' + encodeURIComponent(d.drillId) + '&custom=' + (d.isCustom?1:0) + '" style="flex:1;text-align:center;padding:9px;border-radius:7px;background:#1a2a1a;border:1px solid #3a5a2a;color:#6dbf5a;font-size:12px;font-weight:700;text-decoration:none;">&#9974; Full screen</a>'
                + '<button class="drill-ov-btn" style="background:#2e1a1a;color:#c0392b;flex:none;width:auto;padding:9px 14px;font-size:12px;" onclick="drillOverlayAbandon()">&#10005; Abandon</button>'
                + '</div>'
                + '</div>';
        }

        el.innerHTML = '<div id="rpn-drill-bar">' + collapsedHtml + expandedHtml + '</div>';
        startTimer();
    }

    function escOverlay(s) {
        return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    function startTimer() {
        if (_timerInterval) return;
        var d = getDrill();
        if (!d || !d.startTimestamp) return;
        _timerInterval = setInterval(function() {
            var d2 = getDrill();
            if (!d2 || !d2.startTimestamp) { stopTimer(); render(); return; }
            // Just update timer display without full re-render
            var secs = elapsedSecs(d2);
            var timerEl = document.querySelector('#rpn-drill-expanded span[style*="monospace"]');
            if (timerEl) {
                var col = secs > (d2.targetTime||600) * 1.2 ? '#c0392b' : secs > (d2.targetTime||600) ? '#d4a017' : '#6dbf5a';
                timerEl.textContent = formatTime(secs);
                timerEl.style.color = col;
            }
            var collapsedTimer = document.querySelector('#rpn-drill-collapsed span:nth-child(3)');
            if (collapsedTimer) {
                var done2 = (d2.checked||[]).length;
                collapsedTimer.textContent = done2 + '/' + d2.steps.length + ' steps · ' + formatTime(secs);
            }
        }, 1000);
    }

    function stopTimer() {
        if (_timerInterval) { clearInterval(_timerInterval); _timerInterval = null; }
    }

    // Public API attached to window
    window.drillOverlayToggle = function() {
        _expanded = !_expanded;
        render();
    };

    window.drillOverlayDone = function() {
        var d = getDrill();
        if (!d) return;
        var nextIdx = currentStepIdx(d);
        if (nextIdx >= d.steps.length) return;
        var checked = d.checked || [];
        if (checked.indexOf(nextIdx) === -1) checked.push(nextIdx);
        d.checked = checked;
        d.timerSecs = elapsedSecs(d);
        saveDrill(d);
        render();
    };

    window.drillOverlayFinish = function() {
        var d = getDrill();
        if (!d) return;
        clearDrill();
        stopTimer();
        window.location.href = 'drill-run.html?id=' + encodeURIComponent(d.drillId) + '&custom=' + (d.isCustom?1:0) + '&fromoverlay=1';
    };

    window.drillOverlayAbandon = function() {
        if (!confirm('Abandon this drill? Progress will be lost.')) return;
        clearDrill();
        stopTimer();
        render();
    };

    // Init — inject when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inject);
    } else {
        inject();
    }
})();
