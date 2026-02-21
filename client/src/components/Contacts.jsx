import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Company location: Al Qusais, Al Nahda 1, Dubai (79P6+86)
const COMPANY_LOCATION = [25.1286, 55.4192];

const Contacts = () => {
  const [countryCode, setCountryCode] = useState("+971");

  useEffect(() => {
    async function fetchCountryCode() {
      // Check localStorage first
      const cachedCode = localStorage.getItem("countryCode");
      if (cachedCode) {
        setCountryCode(cachedCode);
        return;
      }

      try {
        const response = await fetch("https://ipapi.co/json/");
        if (!response.ok) {
          throw new Error("Failed to fetch country data");
        }
        const data = await response.json();
        const code = data.country_calling_code || "+971";

        // Store in localStorage to avoid future API calls
        localStorage.setItem("countryCode", code);
        setCountryCode(code);
      } catch (error) {
        console.error("Error fetching country code:", error);
      }
    }

    fetchCountryCode();
  }, []);

  const handleCountryCodeChange = (event) => {
    setCountryCode(event.target.value);
  };

  return (
    <section className="min-h-screen flex flex-col">
      <div className="min-h-[7.5rem] flex items-center px-4 sm:px-6 lg:px-10 py-5 bg-[#091a26]" />

      <div className="bg-[#0d2637] text-[#F5E6D3] flex-grow flex items-center justify-center">
        <div className="max-w-4xl w-full bg-[#0d2637] rounded-lg flex flex-col md:flex-row overflow-hidden shadow-lg">
          {/* Left Section */}
          <div className="w-full md:w-1/2 px-8 py-12">
            <h1 className="text-3xl font-bold mb-4 text-[#F5E6D3]">
              WE WILL CALL YOU BACK, ANSWER YOUR QUESTIONS AND FIND THE SOLUTION
              FOR ANY TASK YOU HAVE
            </h1>
            <p className="mb-6 text-[#E6C9A8]">
              Discussion of the project does not oblige you to anything: we will
              tell you about ourselves and options for implementing your ideas,
              and you will decide on cooperation.
            </p>
            <form className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium">
                  Enter your name*
                </label>
                <input
                  type="text"
                  id="name"
                  placeholder="Your Name"
                  className="w-full mt-1 px-4 py-2 bg-[#143344] text-[#F5E6D3] rounded-lg border border-[#5A2E0D] focus:outline-none focus:ring-2 focus:ring-[#C4864A]"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium">
                  Phone Number
                </label>
                <div className="flex items-center mt-1">
                  {/* <span className="bg-gray-800 text-white px-4 py-2 rounded-l-lg border border-gray-600">
                    {countryCode}
                  </span> */}
                  <input
                    type="text"
                    value={countryCode}
                    onChange={handleCountryCodeChange}
                    className="bg-[#143344] text-[#F5E6D3] px-4 py-2 rounded-l-lg border border-[#5A2E0D] focus:outline-none focus:ring-2 focus:ring-[#C4864A]"
                    style={{ width: "5rem" }}
                  />
                  <input
                    type="text"
                    id="phone"
                    placeholder="Your Phone Number"
                    className="w-full px-4 py-2 bg-[#143344] text-[#F5E6D3] rounded-r-lg border border-[#5A2E0D] focus:outline-none focus:ring-2 focus:ring-[#C4864A]"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-[#8B4513] text-white py-2 rounded-lg hover:bg-[#723A10] focus:outline-none focus:ring-2 focus:ring-[#C4864A]"
              >
                SEND
              </button>
            </form>
            {/* <div className="h-32"></div> */}
          </div>
          {/* Right Section */}
          <div className="w-full md:w-1/2 bg-[#091a26] text-[#E6C9A8] px-8 py-12 flex flex-col space-y-6 justify-between">
            <div>
              <h2 className="text-xl font-semibold">Contact Information</h2>
              <p>ORDER A PROJECT</p>
              <p>+971 54 4666066</p>
              <p>info@attractivehome.ae</p>
            </div>
            <div>
              <p>DUBAI</p>
              <p>+971 43 420732</p>
              {/* <p>51 1 B ST 787J+73, Deira, Dubai, United Arab Emirates</p> */}
              <p>79P6+86, Al Qusais, Al Nahda 1, Dubai, United Arab Emirates</p>
            </div>
            {/* Mini map - company location */}
            <div className="rounded-lg overflow-hidden border border-[#1e3a4d] h-52 w-full flex-shrink-0">
              <MapContainer
                center={COMPANY_LOCATION}
                zoom={15}
                className="h-full w-full"
                scrollWheelZoom={false}
                zoomControl={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={COMPANY_LOCATION}>
                  <Popup>
                    <span className="text-gray-900 font-medium">Attractive Home</span>
                    <br />
                    <span className="text-sm">Al Qusais, Al Nahda 1, Dubai</span>
                  </Popup>
                </Marker>
              </MapContainer>
            </div>
            {/* <div>
              <p>Egypt</p>
              <p>+20 100 474 1603</p>
              <p>
                64 Mohammed Kamel Hussein, Huckstep, El Nozha, Cairo Governorate
              </p>
            </div> */}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contacts;
