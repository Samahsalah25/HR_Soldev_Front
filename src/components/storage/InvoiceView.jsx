import { X, Printer, CreditCard } from "lucide-react";

const COMPANY = {
  name: "شركة التخزين الذاتي",
  address: "الرياض، المملكة العربية السعودية",
  phone: "920000000",
  email: "info@storage.com",
  cr: "1234567890",
  vat: "300000000000003",
};


export default function InvoiceView({ invoice, onClose, onPay }) {

  const company = invoice.company || {};

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      dir="rtl"
    >

      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">


        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-white rounded-t-2xl">

          <h3 className="font-bold text-gray-900">
            فاتورة ضريبية
          </h3>


          <div className="flex gap-2">

            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-3 py-1.5 border rounded-lg text-sm"
            >
              <Printer className="w-4 h-4"/>
              طباعة
            </button>


            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted"
            >
              <X className="w-4 h-4"/>
            </button>

          </div>

        </div>



        <div className="flex-1 overflow-y-auto p-8 space-y-5 text-sm">


          {/* Company Header */}

          <div className="flex justify-between items-start">


            <div>


              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-2">

                <span className="text-white font-black text-xl">
                
                </span>

              </div>



              <h1 className="text-xl font-black">
                {company.name}
              </h1>



              <p className="text-xs text-gray-500">
                {company.address}
              </p>



              <p className="text-xs text-gray-500">
                {company.contact}
              </p>



              <p className="text-xs text-gray-500">
                {company.cr_vat}
              </p>


            </div>

            <div className="text-left space-y-1">


              <div
                className={`px-3 py-1 rounded-full text-sm font-bold ${
                  invoice.state === "paid"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-600"
                }`}
              >

                {invoice.state_label}

              </div>



              <p className="text-gray-500 text-xs">
                فاتورة رقم:
              </p>


              <p className="font-black">
                {invoice.invoice_number}
              </p>



              <p className="text-xs text-gray-500">
                تاريخ الإصدار:
                {" "}
                {invoice.issue_date}
              </p>
              <p className="text-xs text-gray-500">
                تاريخ الاستحقاق:
                {" "}
                {invoice.due_date}
              </p>



              <p className="text-xs text-gray-500">
                نوع الفاتورة:
                {" "}
                {invoice.invoice_type_label}
              </p>
            </div>
          </div>
          {/* Customer */}

          <div className="bg-gray-50 rounded-xl p-4 space-y-1">


            <p className="font-bold mb-2">
              فاتورة إلى:
            </p>


            <p className="font-semibold">

              {invoice.customer_name || "—"}

            </p>



            <p className="text-gray-600">

              {invoice.customer_mobile || "—"}

            </p>



            <p className="text-gray-600">

              {invoice.customer_email || "—"}

            </p>
          </div>
          {/* Items */}

          <table className="w-full border rounded-xl overflow-hidden text-sm">


            <thead className="bg-gray-100">

              <tr>

                <th className="text-right px-4 py-2">
                  البيان
                </th>


                <th className="text-center px-4 py-2">
                  الفترة
                </th>


                <th className="text-center px-4 py-2">
                  السعر
                </th>


                <th className="text-left px-4 py-2">
                  الإجمالي
                </th>


              </tr>


            </thead>



            <tbody>


              <tr className="border-t">


                <td className="px-4 py-3">


                  <p className="font-medium">

                    إيجار وحدة تخزين — {invoice.unit_number}

                  </p>


                  <p className="text-xs text-gray-400">

                    عقد: {invoice.contract_number}

                  </p>


                </td>



                <td className="px-4 py-3 text-center text-xs">


                  {invoice.period_start}

                  <br/>

                  —

                  <br/>

                  {invoice.period_end}


                </td>




                <td className="px-4 py-3 text-center">


                  {invoice.monthly_price?.toLocaleString("ar-SA")}

                  {" × "}

                  {invoice.duration_months}


                </td>




                <td className="px-4 py-3 text-left font-bold">


                  {invoice.price_subtotal?.toLocaleString("ar-SA")}

                  {" ر.س"}


                </td>



              </tr>


            </tbody>


          </table>







          {/* Totals */}


          <div className="border rounded-xl p-4 space-y-2">


            <div className="flex justify-between">

              <span>
                المجموع قبل الضريبة
              </span>


              <span>
                {invoice.price_subtotal?.toLocaleString("ar-SA")} ر.س
              </span>


            </div>





            <div className="flex justify-between">


              <span>
                ضريبة القيمة المضافة
              </span>


              <span>

                {invoice.tax_amount?.toLocaleString("ar-SA")} ر.س

              </span>


            </div>






            <div className="flex justify-between font-black text-lg text-primary border-t pt-2">


              <span>
                الإجمالي المستحق
              </span>


              <span>

                {invoice.total_price?.toLocaleString("ar-SA")} ر.س

              </span>


            </div>

          </div>
          {/* Pay Button */}


          {onPay && invoice.state !== "paid" && (

            <button

              onClick={onPay}

              className="w-full py-3 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2"

            >

              <CreditCard className="w-4 h-4"/>

              ادفع الآن — {invoice.total_price} ر.س


            </button>


          )}

        </div>
      </div>
    </div>
  );
}
