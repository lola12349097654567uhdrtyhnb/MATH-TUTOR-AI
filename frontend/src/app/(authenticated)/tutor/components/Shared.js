import { useMemo } from 'react';

export function FractionCircleSvg({ numerator, denominator, color }) {
  const center = 42;
  const radius = 36;
  const startAngle = -Math.PI / 2;
  let paths = [];

  function polarToCartesian(cx, cy, r, angle) {
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle)
    };
  }

  for (let i = 0; i < denominator; i++) {
    const a0 = startAngle + ((2 * Math.PI) * i / denominator);
    const a1 = startAngle + ((2 * Math.PI) * (i + 1) / denominator);
    const p0 = polarToCartesian(center, center, radius, a0);
    const p1 = polarToCartesian(center, center, radius, a1);
    const largeArc = (a1 - a0) > Math.PI ? 1 : 0;
    const fill = i < numerator ? color : '#ffffff';
    const d = `M ${center} ${center} L ${p0.x} ${p0.y} A ${radius} ${radius} 0 ${largeArc} 1 ${p1.x} ${p1.y} Z`;
    paths.push(<path key={i} d={d} fill={fill} stroke="#d6ddeb" strokeWidth="1" />);
  }

  return (
    <svg width="84" height="84" viewBox="0 0 84 84" aria-label={`${numerator}/${denominator} circle`}>
      {paths}
      <circle cx={center} cy={center} r={radius} fill="none" stroke="#b8c6df" strokeWidth="1.2" />
    </svg>
  );
}

export function VisualHintArea({ visual, currentTopic }) {
  if (currentTopic === 'algebra' && visual) {
    return (
      <div className="hint-visual-wrap show fade-enter-active">
        <div style={{ padding: '15px', border: '2px dashed #9ca3af', borderRadius: '12px', fontFamily: 'monospace', fontSize: '1.1rem', color: '#d1d5db', textAlign: 'center', background: 'rgba(255,255,255,0.05)', marginTop: '10px' }}>
          <i className="fa-solid fa-scale-balanced" />
          <div style={{ marginTop: '10px' }}>Ensure whatever you do to the Left Side of the equal sign, you faithfully do to the Right Side to keep the balance.</div>
        </div>
      </div>
    );
  }

  if (visual && visual.left && visual.right) {
    return (
      <div className="hint-visual-wrap show fade-enter-active">
        <div className="hint-visual-row">
          <div><FractionCircleSvg numerator={visual.left.numerator} denominator={visual.left.denominator} color="#6a8dff" /><div className="fraction-chip">{visual.left.numerator}/{visual.left.denominator}</div></div>
          <div style={{ fontWeight: '700', color: '#7d89a1' }}>+</div>
          <div><FractionCircleSvg numerator={visual.right.numerator} denominator={visual.right.denominator} color="#43b581" /><div className="fraction-chip">{visual.right.numerator}/{visual.right.denominator}</div></div>
        </div>
      </div>
    );
  }

  return null;
}

export function MathText({ content }) {
  const renderedContent = useMemo(() => {
    if (typeof content !== 'string') return content;
    const parts = content.split(/(\b\d+\/\d+\b)/g);
    return parts.map((part, i) => {
      if (part.match(/^\d+\/\d+$/)) {
        const [num, den] = part.split('/');
        return (
          <span key={i} style={{ display: 'inline-flex', flexDirection: 'column', verticalAlign: 'middle', textAlign: 'center', margin: '0 4px', fontSize: '0.85em', lineHeight: '1.2' }}>
            <span style={{ borderBottom: '1px solid currentColor', padding: '0 2px' }}>{num}</span>
            <span style={{ padding: '0 2px' }}>{den}</span>
          </span>
        );
      }
      return part;
    });
  }, [content]);

  return <>{renderedContent}</>;
}

export function SkeletonLoader() {
  return (
    <section className="card fade-enter-active">
      <div className="skeleton skeleton-text short"></div>
      <div className="skeleton skeleton-text"></div>
      <div className="skeleton skeleton-box" style={{marginTop: '20px'}}></div>
      
      <div style={{marginTop: '20px'}}>
        <div className="skeleton skeleton-text short" style={{width: '30%'}}></div>
        <div className="mcq-grid">
          <div className="skeleton skeleton-btn"></div>
          <div className="skeleton skeleton-btn"></div>
          <div className="skeleton skeleton-btn"></div>
          <div className="skeleton skeleton-btn"></div>
        </div>
      </div>
    </section>
  );
}
