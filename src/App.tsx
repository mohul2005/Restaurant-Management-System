import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "./router";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";
import { OrderProvider } from "@/store/OrderProvider";
import { AuthProvider } from "@/store/AuthProvider";

function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <AuthProvider>
        <OrderProvider>
          <BrowserRouter basename={__BASE_PATH__}>
            <AppRoutes />
          </BrowserRouter>
        </OrderProvider>
      </AuthProvider>
    </I18nextProvider>
  );
}

export default App;