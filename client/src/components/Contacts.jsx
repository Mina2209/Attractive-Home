import { useEffect, useState } from "react";

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
      <div className="h-40 bg-[#1f1f1f]"></div>

      <div className="bg-[#181818] text-white flex-grow flex items-center justify-center">
        <div className="max-w-4xl w-full bg-[#181818] rounded-lg flex flex-col md:flex-row overflow-hidden shadow-lg">
          {/* Left Section */}
          <div className="w-full md:w-1/2 px-8 py-12">
            <h1 className="text-3xl font-bold mb-4">
              WE WILL CALL YOU BACK, ANSWER YOUR QUESTIONS AND FIND THE SOLUTION
              FOR ANY TASK YOU HAVE
            </h1>
            <p className="mb-6 text-gray-400">
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
                  className="w-full mt-1 px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="bg-gray-800 text-white px-4 py-2 rounded-l-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ width: "5rem" }}
                  />
                  <input
                    type="text"
                    id="phone"
                    placeholder="Your Phone Number"
                    className="w-full px-4 py-2 bg-gray-800 text-white rounded-r-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                SEND
              </button>
            </form>
            {/* <div className="h-32"></div> */}
          </div>
          {/* Right Section */}
          <div className="w-full md:w-1/2 bg-gray-900 text-gray-400 px-8 py-12 flex flex-col space-y-6 justify-between">
            <div>
              <h2 className="text-xl font-semibold">Contact Information</h2>
              <p>ORDER A PROJECT</p>
              <p>+971 54 4666066</p>
              <p>info@attractivehome.ae</p>
            </div>
            <div>
              <p>DUBAI</p>
              <p>+971 43 420732</p>
              <p>51 1 B ST 787J+73, Deira, Dubai, United Arab Emirates</p>
            </div>
            <div>
              <p>Egypt</p>
              <p>+20 100 474 1603</p>
              <p>
                64 Mohammed Kamel Hussein, Huckstep, El Nozha, Cairo Governorate
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contacts;
