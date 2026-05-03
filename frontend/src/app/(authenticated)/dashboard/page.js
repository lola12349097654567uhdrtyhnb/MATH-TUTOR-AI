'use client';
import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();
  useEffect(() => {
    async function checkRole() {
      const sesh = await fetch('/api/auth/session');
      if (sesh.ok) {
        const seshData = await sesh.json();
        if (seshData.role === 'instructor') {
          router.push('/instructor/overview');
        }
      }
    }
    checkRole();
  }, [router]);

  return (
    <div className="container">
      <header className="page-header">
        <div className="header-row">
          <div>
            <h1 className="title">Student Hub</h1>
            <p className="subtitle">Welcome back! Choose a topic below to begin practice.</p>
          </div>
          <Link className="btn btn-secondary" href="/api/auth/logout"><i className="fa-solid fa-arrow-right-from-bracket"></i> Sign out</Link>
        </div>
      </header>

      <main>
        <div className="grid">
          <section className="card card-hoverable" style={{textAlign: 'center', padding: '40px 20px'}}>
            <div className="icon-wrapper">
              <i className="fa-solid fa-shapes"></i>
            </div>
            <h2 className="section-title">Fractions Unit</h2>
            <p className="section-note" style={{marginBottom: '20px'}}>Master adding, subtracting, and interpreting visual fractions.</p>
            <Link className="btn btn-primary" href="/tutor?topic=fractions" style={{width: '100%'}}>Start Fractions</Link>
          </section>

          <section className="card card-hoverable" style={{textAlign: 'center', padding: '40px 20px'}}>
            <div className="icon-wrapper">
              <i className="fa-solid fa-square-root-variable"></i>
            </div>
            <h2 className="section-title">Algebraic Equations</h2>
            <p className="section-note" style={{marginBottom: '20px'}}>Solve for x and balance the mathematical scales.</p>
            <Link className="btn btn-primary" href="/tutor?topic=algebra" style={{width: '100%'}}>Start Algebra</Link>
          </section>

          <section className="card card-hoverable" style={{textAlign: 'center', padding: '40px 20px'}}>
            <div className="icon-wrapper">
              <i className="fa-solid fa-superscript"></i>
            </div>
            <h2 className="section-title">Exponents & Scientific</h2>
            <p className="section-note" style={{marginBottom: '20px'}}>Master laws of exponents and large numbers.</p>
            <Link className="btn btn-primary" href="/tutor?topic=exponents" style={{width: '100%'}}>Start Exponents</Link>
          </section>

          <section className="card card-hoverable" style={{textAlign: 'center', padding: '40px 20px'}}>
            <div className="icon-wrapper">
              <i className="fa-solid fa-cube"></i>
            </div>
            <h2 className="section-title">Geometry & Areas</h2>
            <p className="section-note" style={{marginBottom: '20px'}}>Calculate spatial areas, Pythagorean, and volume.</p>
            <Link className="btn btn-primary" href="/tutor?topic=geometry" style={{width: '100%'}}>Start Geometry</Link>
          </section>
        </div>
      </main>
    </div>
  );
}
