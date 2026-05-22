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

function parseMathWord(word, idx) {
  if (typeof word !== 'string') return word;
  if (!word) return null;
  
  // Extract trailing punctuation like ",", ".", ":", ";", "?", "!"
  const punctuationMatch = word.match(/[.,;:!?]+$/);
  if (punctuationMatch) {
    const punc = punctuationMatch[0];
    const mainWord = word.slice(0, -punc.length);
    return (
      <span key={idx}>
        {parseMathWord(mainWord, `${idx}-main`)}
        {punc}
      </span>
    );
  }
  
  // Extract leading punctuation like ",", ".", ":", ";", "?", "!"
  const leadingPuncMatch = word.match(/^[.,;:!?]+/);
  if (leadingPuncMatch) {
    const punc = leadingPuncMatch[0];
    const mainWord = word.slice(punc.length);
    return (
      <span key={idx}>
        {punc}
        {parseMathWord(mainWord, `${idx}-main`)}
      </span>
    );
  }
  
  // If the word starts with "(" and ends with ")", strip them and recursively parse the inner content, wrapping the result in parenthetical spans!
  if (word.startsWith('(') && word.endsWith(')')) {
    const inner = word.slice(1, -1);
    return (
      <span key={idx}>
        (
        {parseMathWord(inner, `${idx}-in`)}
        )
      </span>
    );
  }
  
  // Handle carets "^" for exponents
  if (word.includes('^')) {
    const lastCaret = word.lastIndexOf('^');
    const baseStr = word.substring(0, lastCaret);
    const expStr = word.substring(lastCaret + 1);
    
    return (
      <span key={idx}>
        {parseMathWord(baseStr, `${idx}-b`)}
        <sup style={{ fontSize: '0.7em', fontWeight: '700' }}>
          {parseMathWord(expStr, `${idx}-e`)}
        </sup>
      </span>
    );
  }
  
  // Handle direct variable exponents (e.g., b7, b12, x5)
  const varExpMatch = word.match(/^([a-zA-Z])(\d+)$/);
  if (varExpMatch) {
    const base = varExpMatch[1];
    const exp = varExpMatch[2];
    return (
      <span key={idx}>
        <span style={{ fontStyle: 'italic', fontFamily: 'Georgia, serif', fontWeight: '700' }}>{base}</span>
        <sup style={{ fontSize: '0.7em', fontWeight: '700' }}>{exp}</sup>
      </span>
    );
  }
  
  // Check if fraction "num/den"
  const fractionMatch = word.match(/(\d+)\/(\d+)/);
  if (fractionMatch) {
    const num = fractionMatch[1];
    const den = fractionMatch[2];
    const fracIndex = fractionMatch.index;
    const beforeStr = word.substring(0, fracIndex);
    const afterStr = word.substring(fracIndex + fractionMatch[0].length);
    
    return (
      <span key={idx} style={{ display: 'inline-flex', alignItems: 'center' }}>
        {beforeStr && parseMathWord(beforeStr, `${idx}-bef`)}
        <span style={{ display: 'inline-flex', flexDirection: 'column', verticalAlign: 'middle', textAlign: 'center', margin: '0 4px', fontSize: '0.85em', lineHeight: '1.2' }}>
          <span style={{ borderBottom: '1px solid currentColor', padding: '0 2px' }}>{num}</span>
          <span style={{ padding: '0 2px' }}>{den}</span>
        </span>
        {afterStr && parseMathWord(afterStr, `${idx}-aft`)}
      </span>
    );
  }
  
  // Check for standalone variable (e.g. "x", "y", "b")
  if (word.match(/^[a-zA-Z]$/) && !['a', 'A', 'I'].includes(word)) {
    return (
      <span key={idx} style={{ fontStyle: 'italic', fontFamily: 'Georgia, serif', fontWeight: '700' }}>
        {word}
      </span>
    );
  }
  
  return word;
}

export function MathText({ content }) {
  const renderedContent = useMemo(() => {
    if (typeof content !== 'string') return content;
    
    // Split by spaces/whitespace to tokenize words cleanly without capture overlaps
    const words = content.split(/(\s+)/);
    
    return words.map((word, idx) => {
      if (!word) return null;
      if (word.trim() === '') return word; // Preserve spacing
      
      return parseMathWord(word, idx);
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
