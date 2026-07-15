import { X, Printer } from "lucide-react";
import api from "../../api/axios";

const COMPANY = {
  name: "شركة التخزين الذاتي",
  address: "الرياض، المملكة العربية السعودية",
  phone: "920000000",
  email: "info@storage.com",
  cr: "1234567890",
  vat: "300000000000003",
};

import { useEffect, useState } from "react";

export default function ContractView({ contract, onClose }) {

  const handlePrint = () => window.print();

  const lessor = contract?.lessor || {};


  const [customerSignature, setCustomerSignature] = useState(null);
  const [companySignature, setCompanySignature] = useState(null);
useEffect(() => {

 console.log("CONTRACT:", contract);
 console.log("CUSTOMER SIGN:", contract?.customer_signature);
 console.log("COMPANY SIGN:", contract?.company_signature);

}, [contract]);


 useEffect(() => {

  let customerUrl = null;
  let companyUrl = null;


  const loadSignatures = async () => {

    try {


      if (contract?.customer_signature) {

        const customerPath =
          contract.customer_signature.replace("/api/v1", "");


        const res = await api.get(
          customerPath,
          {
            responseType: "blob",
            headers: {
              Accept: "image/*",
            },
          }
        );


        customerUrl = URL.createObjectURL(res.data);

        setCustomerSignature(customerUrl);

      }




     if (contract?.company_signature) {

  const companyPath =
    contract.company_signature.replace("/api/v1", "");


  const res = await api.get(
    companyPath,
    {
      responseType: "blob",
    }
  );


  console.log(
    "COMPANY STATUS",
    res.status
  );


  console.log(
    "COMPANY TYPE",
    res.headers["content-type"]
  );


  console.log(
    "COMPANY SIZE",
    res.data.size
  );


  companyUrl = URL.createObjectURL(res.data);

  setCompanySignature(companyUrl);
}



    } catch (error) {

      console.error(
        "Signature loading error:",
        error
      );

    }

  };


  loadSignatures();



  return () => {

    if (customerUrl) {
      URL.revokeObjectURL(customerUrl);
    }


    if (companyUrl) {
      URL.revokeObjectURL(companyUrl);
    }

  };


}, [contract]);



  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      dir="rtl"
    >

      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl max-h-[90vh] flex flex-col">


        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-white rounded-t-2xl">


          <h3 className="font-bold text-gray-900">
            عقد إيجار وحدة تخزين
          </h3>


          <div className="flex gap-2">

            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-3 py-1.5 border rounded-lg text-sm hover:bg-muted"
            >

              <Printer className="w-4 h-4" />

              طباعة

            </button>



            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted"
            >

              <X className="w-4 h-4" />

            </button>

          </div>

        </div>





        <div
          className="flex-1 overflow-y-auto p-8 space-y-6 text-sm"
          id="contract-print"
        >



          {/* Header */}

          <div className="text-center border-b-2 pb-4">

            <h1 className="text-2xl font-black">
              عقد إيجار وحدة تخزين ذاتي
            </h1>


            <p className="text-gray-500">
              Storage Unit Lease Agreement
            </p>


            <p className="font-bold text-primary">
              رقم العقد: {contract.contract_number}
            </p>


          </div>







          {/* الأطراف */}

          <div className="grid grid-cols-2 gap-6">



            {/* المؤجر */}

            <div className="border rounded-xl p-4 space-y-2">


              <h3 className="font-bold border-b pb-2">
                الطرف الأول (المؤجر)
              </h3>



              <Row label="الاسم" value={lessor.name} />

              <Row label="السجل التجاري" value={lessor.cr} />

              <Row label="الرقم الضريبي" value={lessor.vat} />

              <Row label="العنوان" value={lessor.address} />

              <Row label="الهاتف" value={lessor.phone} />

              <Row label="البريد" value={lessor.email} />


            </div>






            {/* العميل */}

            <div className="border rounded-xl p-4 space-y-2">


              <h3 className="font-bold border-b pb-2">
                الطرف الثاني (المستأجر)
              </h3>



              <Row
                label="الاسم"
                value={contract.customer_name}
              />


              {contract.company_name && (
                <Row
                  label="الشركة"
                  value={contract.company_name}
                />
              )}



              {contract.company_cr_number && (
                <Row
                  label="السجل التجاري"
                  value={contract.company_cr_number}
                />
              )}



              {contract.company_tax_number && (
                <Row
                  label="الرقم الضريبي"
                  value={contract.company_tax_number}
                />
              )}



              <Row
                label="رقم الهوية"
                value={contract.customer_id_number}
              />



              <Row
                label="الهاتف"
                value={contract.customer_mobile}
              />



              <Row
                label="البريد"
                value={contract.customer_email}
              />


            </div>


          </div>








          {/* تفاصيل العقد */}

          <div className="border rounded-xl p-4">


            <h3 className="font-bold border-b pb-2 mb-3">
              تفاصيل الوحدة والعقد
            </h3>



            <div className="grid grid-cols-2 gap-4">


              <Row
                label="رقم الوحدة"
                value={contract.unit_number}
              />



              <Row
                label="الموقع"
                value={contract.location}
              />



              <Row
                label="نوع المخزون"
                value={contract.stored_objects_type}
              />



              <Row
                label="السعر الشهري"
                value={`${contract.monthly_price} ريال`}
              />



              <Row
                label="الإجمالي"
                value={`${contract.total_price} ريال`}
              />



              <Row
                label="تاريخ البداية"
                value={contract.contract_start_date}
              />



              <Row
                label="تاريخ الانتهاء"
                value={contract.contract_end_date}
              />



              <Row
                label="مدة العقد"
                value={`${contract.duration_months} شهر`}
              />



              <Row
                label="التجديد"
                value={contract.renewal_label}
              />



              <Row
                label="الحالة"
                value={contract.state_label}
              />



            </div>


          </div>







          {/* الشروط */}

          <div className="border rounded-xl p-4">


            <h3 className="font-bold border-b pb-2 mb-3">
              الشروط والأحكام
            </h3>


            <div className="text-gray-600 text-xs space-y-2">


              <p>
                1- يلتزم المستأجر بدفع قيمة الإيجار في المواعيد المحددة.
              </p>


              <p>
                2- يمنع تخزين المواد الخطرة أو الممنوعة.
              </p>


              <p>
                3- يجب إخلاء الوحدة عند انتهاء مدة العقد.
              </p>


              <p>
                4- يتم التجديد حسب سياسة العقد.
              </p>


            </div>


          </div>








          {/* التوقيعات */}

          <div className="grid grid-cols-2 gap-6">



            {/* الشركة */}

            <div className="border rounded-xl p-4 text-center space-y-3">


              <p className="font-bold">
                توقيع الطرف الأول
              </p>


              <p className="text-xs">
                {lessor.name}
              </p>



              <div className="h-16 flex items-center justify-center">


            {companySignature ? (

  <img
    src={companySignature}
    alt="توقيع الشركة"
    className="h-20 object-contain border"
  />

) : (

  <p>
    _________________
  </p>

)}



              </div>


            </div>








            {/* العميل */}

            <div className="border rounded-xl p-4 text-center space-y-3">


              <p className="font-bold">
                توقيع الطرف الثاني
              </p>


              <p className="text-xs">
                {contract.customer_name}
              </p>



              <div className="h-16 flex items-center justify-center">


                {customerSignature ? (

                  <img
                    src={customerSignature}
                    alt="توقيع العميل"
                    className="h-14 object-contain"
                  />


                ) : (

                  <p>
                    _________________
                  </p>

                )}


              </div>


            </div>



          </div>






          <p className="text-center text-xs text-gray-400 border-t pt-3">

            هذا العقد محرر من نسختين لكل طرف نسخة — {lessor.name}

          </p>



        </div>


      </div>


    </div>
  );
}












function Row({ label, value }) {
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-gray-500 min-w-28 shrink-0">{label}:</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}