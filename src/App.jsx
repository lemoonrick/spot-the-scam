import { useEffect, useState } from 'react';
import './App.css';
import ScamScreen from './ScamScreen';

export default function App() {
  const [started, setStarted] = useState(false);

  return (
    <div className={`app ${started ? 'app-entered' : ''}`}>
      {!started ? (
        <StartScreen onStart={() => setStarted(true)} />
      ) : (
        <ScamScreen />
      )}
    </div>
  );
}

const StartScreen = ({ onStart }) => {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    setEntered(true);
  }, []);

  const handleMouseMove = (e) => {
    const { innerWidth, innerHeight } = window;
    const x = (e.clientX / innerWidth - 0.5) * 20;
    const y = (e.clientY / innerHeight - 0.5) * 20;

    document.documentElement.style.setProperty('--parallax-x', `${x}px`);
    document.documentElement.style.setProperty('--parallax-y', `${y}px`);
  };

  return (
    <div className="hero-wrapper" onMouseMove={handleMouseMove}>
      <div className={`hero-content ${entered ? 'entered' : ''}`}>
        <h1 className="hero-title">
          Spot the <span className="highlight">Scam</span>
          <br />
          before it spots you!
        </h1>

        <p className="hero-subtitle">
          Practice spotting scams, fake messages,
          <br />
          and manipulation tactics in a safe and interactive way.
        </p>

        <button className="hero-btn" onClick={onStart}>
          Get Started
        </button>
      </div>

      <div className="hero-footer">
        <a href="https://myfactree.org">
          <img
            src="/src/assets/logo.png"
            alt="FactTree"
            className="hero-logo"
          />
        </a>

        <div className="hero-socials">
          <a href="https://instagram.com/myfactree_" target="_blank">
            <svg
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
              <g
                id="SVGRepo_tracerCarrier"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></g>
              <g id="SVGRepo_iconCarrier">
                {' '}
                <rect
                  x="2"
                  y="2"
                  width="28"
                  height="28"
                  rx="6"
                  fill="url(#paint0_radial_87_7153)"
                ></rect>{' '}
                <rect
                  x="2"
                  y="2"
                  width="28"
                  height="28"
                  rx="6"
                  fill="url(#paint1_radial_87_7153)"
                ></rect>{' '}
                <rect
                  x="2"
                  y="2"
                  width="28"
                  height="28"
                  rx="6"
                  fill="url(#paint2_radial_87_7153)"
                ></rect>{' '}
                <path
                  d="M23 10.5C23 11.3284 22.3284 12 21.5 12C20.6716 12 20 11.3284 20 10.5C20 9.67157 20.6716 9 21.5 9C22.3284 9 23 9.67157 23 10.5Z"
                  fill="white"
                ></path>{' '}
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M16 21C18.7614 21 21 18.7614 21 16C21 13.2386 18.7614 11 16 11C13.2386 11 11 13.2386 11 16C11 18.7614 13.2386 21 16 21ZM16 19C17.6569 19 19 17.6569 19 16C19 14.3431 17.6569 13 16 13C14.3431 13 13 14.3431 13 16C13 17.6569 14.3431 19 16 19Z"
                  fill="white"
                ></path>{' '}
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M6 15.6C6 12.2397 6 10.5595 6.65396 9.27606C7.2292 8.14708 8.14708 7.2292 9.27606 6.65396C10.5595 6 12.2397 6 15.6 6H16.4C19.7603 6 21.4405 6 22.7239 6.65396C23.8529 7.2292 24.7708 8.14708 25.346 9.27606C26 10.5595 26 12.2397 26 15.6V16.4C26 19.7603 26 21.4405 25.346 22.7239C24.7708 23.8529 23.8529 24.7708 22.7239 25.346C21.4405 26 19.7603 26 16.4 26H15.6C12.2397 26 10.5595 26 9.27606 25.346C8.14708 24.7708 7.2292 23.8529 6.65396 22.7239C6 21.4405 6 19.7603 6 16.4V15.6ZM15.6 8H16.4C18.1132 8 19.2777 8.00156 20.1779 8.0751C21.0548 8.14674 21.5032 8.27659 21.816 8.43597C22.5686 8.81947 23.1805 9.43139 23.564 10.184C23.7234 10.4968 23.8533 10.9452 23.9249 11.8221C23.9984 12.7223 24 13.8868 24 15.6V16.4C24 18.1132 23.9984 19.2777 23.9249 20.1779C23.8533 21.0548 23.7234 21.5032 23.564 21.816C23.1805 22.5686 22.5686 23.1805 21.816 23.564C21.5032 23.7234 21.0548 23.8533 20.1779 23.9249C19.2777 23.9984 18.1132 24 16.4 24H15.6C13.8868 24 12.7223 23.9984 11.8221 23.9249C10.9452 23.8533 10.4968 23.7234 10.184 23.564C9.43139 23.1805 8.81947 22.5686 8.43597 21.816C8.27659 21.5032 8.14674 21.0548 8.0751 20.1779C8.00156 19.2777 8 18.1132 8 16.4V15.6C8 13.8868 8.00156 12.7223 8.0751 11.8221C8.14674 10.9452 8.27659 10.4968 8.43597 10.184C8.81947 9.43139 9.43139 8.81947 10.184 8.43597C10.4968 8.27659 10.9452 8.14674 11.8221 8.0751C12.7223 8.00156 13.8868 8 15.6 8Z"
                  fill="white"
                ></path>{' '}
                <defs>
                  {' '}
                  <radialGradient
                    id="paint0_radial_87_7153"
                    cx="0"
                    cy="0"
                    r="1"
                    gradientUnits="userSpaceOnUse"
                    gradientTransform="translate(12 23) rotate(-55.3758) scale(25.5196)"
                  >
                    {' '}
                    <stop stop-color="#B13589"></stop>{' '}
                    <stop offset="0.79309" stop-color="#C62F94"></stop>{' '}
                    <stop offset="1" stop-color="#8A3AC8"></stop>{' '}
                  </radialGradient>{' '}
                  <radialGradient
                    id="paint1_radial_87_7153"
                    cx="0"
                    cy="0"
                    r="1"
                    gradientUnits="userSpaceOnUse"
                    gradientTransform="translate(11 31) rotate(-65.1363) scale(22.5942)"
                  >
                    {' '}
                    <stop stop-color="#E0E8B7"></stop>{' '}
                    <stop offset="0.444662" stop-color="#FB8A2E"></stop>{' '}
                    <stop offset="0.71474" stop-color="#E2425C"></stop>{' '}
                    <stop
                      offset="1"
                      stop-color="#E2425C"
                      stop-opacity="0"
                    ></stop>{' '}
                  </radialGradient>{' '}
                  <radialGradient
                    id="paint2_radial_87_7153"
                    cx="0"
                    cy="0"
                    r="1"
                    gradientUnits="userSpaceOnUse"
                    gradientTransform="translate(0.500002 3) rotate(-8.1301) scale(38.8909 8.31836)"
                  >
                    {' '}
                    <stop offset="0.156701" stop-color="#406ADC"></stop>{' '}
                    <stop offset="0.467799" stop-color="#6A45BE"></stop>{' '}
                    <stop
                      offset="1"
                      stop-color="#6A45BE"
                      stop-opacity="0"
                    ></stop>{' '}
                  </radialGradient>{' '}
                </defs>{' '}
              </g>
            </svg>
          </a>

          <a href="https://twitter.com/myfactree" target="_blank">
            <svg
              viewBox="0 -23.5 256 256"
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
              xmlns:xlink="http://www.w3.org/1999/xlink"
              preserveAspectRatio="xMidYMid"
              fill="#000000"
            >
              <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
              <g
                id="SVGRepo_tracerCarrier"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></g>
              <g id="SVGRepo_iconCarrier">
                {' '}
                <g>
                  {' '}
                  <path
                    d="M256,25.4500259 C246.580841,29.6272672 236.458451,32.4504868 225.834156,33.7202333 C236.678503,27.2198053 245.00583,16.9269929 248.927437,4.66307685 C238.779765,10.6812633 227.539325,15.0523376 215.57599,17.408298 C205.994835,7.2006971 192.34506,0.822 177.239197,0.822 C148.232605,0.822 124.716076,24.3375931 124.716076,53.3423116 C124.716076,57.4586875 125.181462,61.4673784 126.076652,65.3112644 C82.4258385,63.1210453 43.7257252,42.211429 17.821398,10.4359288 C13.3005011,18.1929938 10.710443,27.2151234 10.710443,36.8402889 C10.710443,55.061526 19.9835254,71.1374907 34.0762135,80.5557137 C25.4660961,80.2832239 17.3681846,77.9207088 10.2862577,73.9869292 C10.2825122,74.2060448 10.2825122,74.4260967 10.2825122,74.647085 C10.2825122,100.094453 28.3867003,121.322443 52.413563,126.14673 C48.0059695,127.347184 43.3661509,127.988612 38.5755734,127.988612 C35.1914554,127.988612 31.9009766,127.659938 28.694773,127.046602 C35.3777973,147.913145 54.7742053,163.097665 77.7569918,163.52185 C59.7820257,177.607983 37.1354036,186.004604 12.5289147,186.004604 C8.28987161,186.004604 4.10888474,185.75646 0,185.271409 C23.2431033,200.173139 50.8507261,208.867532 80.5109185,208.867532 C177.116529,208.867532 229.943977,128.836982 229.943977,59.4326002 C229.943977,57.1552968 229.893412,54.8901664 229.792282,52.6381454 C240.053257,45.2331635 248.958338,35.9825545 256,25.4500259"
                    fill="#55acee"
                  >
                    {' '}
                  </path>{' '}
                </g>{' '}
              </g>
            </svg>
          </a>
        </div>
      </div>

      {/* Floating Icons */}
      <div className="floating-icon icon-1">🔍</div>
      <div className="floating-icon icon-2">🛡</div>
      <div className="floating-icon icon-3">📧</div>
      <div className="floating-icon icon-4">⚠</div>
      <div className="floating-icon icon-5">🧠</div>
    </div>
  );
};
