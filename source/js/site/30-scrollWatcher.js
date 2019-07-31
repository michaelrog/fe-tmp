/*
 * Based on https://github.com/dollarshaveclub/scrolldir
 */

const scrollWatcher = function() {

    let attribute = 'data-scrolldir';
    let dir = 'down'; // 'up' or 'down'
    let el = document.documentElement;
    let win = window;
    let onTick = function(){};
    let onChange = function(){};

    const body = document.body;
    const historyLength = 32; // Ticks to keep in history.
    const historyMaxAge = 512; // History data time-to-live (ms).
    const thresholdPixels = 64; // Ignore moves smaller than this.
    const history = Array(historyLength);

    let e; // last scroll event
    let pivot; // "high-water mark"
    let pivotTime = 0;

    function tick() {

        let y = win.scrollY || win.pageYOffset;
        const t = e.timeStamp;
        const furthest = dir === 'down' ? Math.max : Math.min;

        // Apply bounds to handle rubber banding
        const winInnerHeight = win.innerHeight;
        const yMax = body.offsetHeight - winInnerHeight;
        y = Math.max(0, y);
        y = Math.min(yMax, y);

        // Update history
        history.unshift({ y, t });
        history.pop();

        onTick({
            dir,
            y,
            yMax,
            yBottom: y + winInnerHeight,
        });

        // Are we continuing in the same direction?
        if (y === furthest(pivot, y)) {
            // Update "high-water mark" for current direction
            pivotTime = t;
            pivot = y;
            return;
        }
        // else we have backed off high-water mark

        // Apply max age to find current reference point
        const cutoffTime = t - historyMaxAge;
        if (cutoffTime > pivotTime) {
            pivot = y;
            for (let i = 0; i < historyLength; i += 1) {
                if (!history[i] || history[i].t < cutoffTime) break;
                pivot = furthest(pivot, history[i].y);
            }
        }

        // Have we exceeded threshold?
        if (Math.abs(y - pivot) > thresholdPixels) {
            pivot = y;
            pivotTime = t;
            dir = dir === 'down' ? 'up' : 'down';
            el.setAttribute(attribute, dir);
            onChange({
                dir,
                y,
                yMax,
                yBottom: y + winInnerHeight,
            })
        }

    }

    function handler(event) {

        e = event;
        return win.requestAnimationFrame(tick);

    }

    let init = function init(opts) {

        if (opts) {
            if (opts.attribute) attribute = opts.attribute;
            if (opts.el) el = opts.el;
            if (opts.win) win = opts.win;
            if (opts.dir) dir = opts.dir;
            if (opts.onTick) onTick = opts.onTick;
            if (opts.onChange) onChange = opts.onChange;
            if (opts.off === true) {
                return off();
            }
        }

        pivot = win.scrollY || win.pageYOffset;
        el.setAttribute(attribute, dir);
        return win.addEventListener('scroll', handler);

    };

    let off = function off() {

        el.setAttribute(attribute, 'off');
        return win.removeEventListener('scroll', handler);

    };

    return {
        init,
        off
    }

};

SITE.scrollWatcher = scrollWatcher();
