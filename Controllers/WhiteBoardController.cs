using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.IO;

namespace InteractiveLearning.Controllers
{
     [Authorize]
    
    public class WhiteBoardController : Controller
    {
        //
        // GET: /WhiteBoard/

        public ActionResult Index(int? testID,int? qID,int? secId,int? targetPage,string imgData)
        {
            if (testID != null && qID != null)
            {
                ViewBag.testID = testID;
                ViewBag.qID = qID;
            }


            if ( qID != null)
            {
               
                ViewBag.qID = qID;
            }

            if (secId != null)
            {
               
                ViewBag.sID = secId;
            }
            if (targetPage != null && targetPage == 1)
            {
                ViewBag.targetPage = targetPage;
            }
            if (imgData != null && imgData !="")
            {
                ViewBag.imgData = imgData;
            }
            return View();
        }
     [HttpPost]
    
        public ActionResult Back(string cID,string qID,string sId,string imagedata,string targetPg,string imgOld)
        {
          // return RedirectToAction("../Views/ Test/AddQuestion?cID="+ViewBag.testID+"&num="+ViewBag.qID);
           long cid = Convert.ToInt64(cID);
           int qd = Convert.ToInt32(qID);
           int tpg ;
           if (targetPg != "")
           {
               tpg = Convert.ToInt32(targetPg);
           }
           else
               tpg = 0;
               
           long sd=-1;
           if (sId != "")
           {
              sd= Convert.ToInt64(sId);
           }
           string p;
           var path ="";
           var fileName = "";
           if (imgOld == "" || imgOld == null)
           {
               Guid g = Guid.NewGuid();
               p = Convert.ToBase64String(g.ToByteArray());
               p = p.Replace("=", "");
               p = p.Replace("+", "");
               p = p.Replace("/", "");
               p = p.Replace(@"\", "");

               fileName = p + ".png";
              path = Path.Combine(System.Web.HttpContext.Current.Server.MapPath("~/Content/TestImages/"), fileName);
           }
           else
           {
               fileName = imgOld;
               path = Path.Combine(System.Web.HttpContext.Current.Server.MapPath("~/Content/TestImages/"), fileName);
        
           }
           string fileNameWitPath = path;// +fileName;
           string imageData = imagedata.Replace("data:image/png;base64,", "");

           using (FileStream fs = new FileStream(fileNameWitPath, FileMode.Create))
           {

               using (BinaryWriter bw = new BinaryWriter(fs))
               {

                   byte[] data = Convert.FromBase64String(imageData);

                   bw.Write(data);

                   bw.Close();


               }

           }

         if(tpg!= 1)
             return RedirectToAction("AddQuestion", "Test", new {  cID = cid, num = qd,sID = sd, imgdata = fileName.ToString() });
         else
           return RedirectToAction("UpdateQues", "Test", new { id = qd,imgdata = fileName.ToString() });
        }

   [HttpPost]

     public ActionResult Cancel(string cD, string qD, string sD, string tPg)
     {
         long cid = Convert.ToInt64(cD);
         int qd = Convert.ToInt32(qD);
         long sd = Convert.ToInt32(sD);
         int tpg;
         if (tPg != "")
         {
             tpg = Convert.ToInt32(tPg);
         }
         else
             tpg = 0;
               
             if (tpg != 1)
             {

                 return RedirectToAction("AddQuestion", "Test", new { cID = cid, num = qd, sID = sd });
             }
         
         else
             return RedirectToAction("UpdateQues", "Test", new { id = qd });
     

     }

    
    }
}
