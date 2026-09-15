'use client';

import React, { useState, useRef } from 'react';
import { flushSync } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { FileText, User, AlertTriangle, Printer, FileDown } from 'lucide-react';
import { PUNJAB_GOVT_LOGO, SUTHRA_PUNJAB_LOGO } from './logo-data';
import { TOWNS } from '@/lib/constants';
import './challan.css';

const BLANK = '___________';
const BLANK_SHORT = '___';

async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const MAX_WIDTH = 1200;
      let { width, height } = img;
      if (width > MAX_WIDTH) {
        height = Math.round((height * MAX_WIDTH) / width);
        width = MAX_WIDTH;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        blob => blob ? resolve(blob) : reject(new Error('Compression failed')),
        'image/jpeg',
        0.8
      );
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

const challanSchema = z.object({
  datetime: z.string().min(1, 'Date & Time is required'),
  location: z.string().min(1, 'Location is required'),
  uc: z.string().min(1, 'UC is required'),
  zone: z.string().min(1, 'Zone is required'),
  tehsil: z.string().min(1, 'Tehsil is required'),
  district: z.string().min(1, 'District is required'),
  name: z.string().min(1, 'Citizen Name is required'),
  cnic: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().min(1, 'Citizen Address is required'),
  violation_description: z.string().min(1, 'Violation Description is required'),
  warning_count: z.coerce.number().int().min(0),
});

type ChallanFormValues = z.infer<typeof challanSchema>;

interface ChallanClientProps {
  user: {
    name: string;
    staffId: string;
    town: string;
  };
}

export default function ChallanClient({ user }: ChallanClientProps) {
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form');
  const [isGenerating, setIsGenerating] = useState(false);
  const [assignedNoticeNo, setAssignedNoticeNo] = useState<string>('');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [violationImage, setViolationImage] = useState<File | null>(null);
  const [violationImagePreviewUrl, setViolationImagePreviewUrl] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const { register, watch, formState: { errors }, trigger, setValue } = useForm<ChallanFormValues>({
    resolver: zodResolver(challanSchema),
    defaultValues: {
      warning_count: 0,
      district: 'Lahore',
      tehsil: TOWNS[0],
      datetime: (() => {
        const now = new Date();
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
      })(),
    }
  });

  const formValues = watch();

  const formatDatetime = (val?: string) => {
    if (!val) return BLANK;
    const dt = new Date(val);
    if (isNaN(dt.getTime())) return val;
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric', month: 'short', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: true
    };
    return dt.toLocaleString('en-PK', options);
  };

  const fetchLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    setIsFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setValue('location', `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`, { shouldValidate: true });
        setIsFetchingLocation(false);
      },
      () => {
        alert('Unable to retrieve your location');
        setIsFetchingLocation(false);
      }
    );
  };

  const handleSaveAndPrint = async (mode: 'print' | 'pdf') => {
    const isValid = await trigger();
    if (!isValid) {
      if (window.innerWidth <= 768) setActiveTab('form');
      return;
    }

    setSaveError(null);
    setIsGenerating(true);
    let currentNoticeNo = assignedNoticeNo;

    // Save to DB if not saved yet
    if (!currentNoticeNo) {
      try {
        let imageUrl: string | undefined = undefined;

        if (violationImage) {
          const formData = new FormData();
          formData.append('file', violationImage);

          const uploadRes = await fetch('/api/inspector/upload', {
            method: 'POST',
            body: formData,
          });

          if (!uploadRes.ok) {
            const errData = await uploadRes.json();
            throw new Error(errData.error || 'Failed to upload photo');
          }

          const uploadData = await uploadRes.json();
          imageUrl = uploadData.url;
        }

        const res = await fetch('/api/inspector/challans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formValues, violationImageUrl: imageUrl }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to save challan');
        }

        const data = await res.json();
        currentNoticeNo = data.noticeNo;
      } catch (err: unknown) {
        setSaveError(err instanceof Error ? err.message : String(err));
        setIsGenerating(false);
        return;
      }
    }

    // Update state synchronously so the receipt preview shows the notice number
    flushSync(() => {
      if (!assignedNoticeNo) {
        setAssignedNoticeNo(currentNoticeNo);
      }
      // On mobile, show the preview tab so html2canvas can capture it for PDF
      if (mode === 'pdf' && window.innerWidth <= 768 && activeTab !== 'preview') {
        setActiveTab('preview');
      }
    });

    // Give the browser a tick to paint before capturing
    setTimeout(() => {
      if (mode === 'print') {
        doPrint(currentNoticeNo);
        setIsGenerating(false);
      } else {
        generatePDF(currentNoticeNo);
      }
    }, 150);
  };

  /** Open a new window with large-format print HTML matching the reference PDF proportions */
  const doPrint = (noticeNo: string) => {
    const f = formValues;

    function bar(text: string) {
      return `<div style="background:#000;color:#fff;font-weight:bold;font-size:36pt;text-align:center;padding:15px;margin:25px 0 20px;-webkit-print-color-adjust:exact;print-color-adjust:exact;color-adjust:exact;font-family:Arial,Helvetica,sans-serif">${text}</div>`;
    }
    function row(label: string, value: string) {
      return `<div style="margin-bottom:20px;">` +
        `<p style="font-weight:bold;font-size:26pt;margin:0;text-transform:uppercase;line-height:1.35;letter-spacing:0.02em;font-family:Arial,Helvetica,sans-serif;color:#000">${label}</p>` +
        `<p style="font-style:italic;font-size:32pt;margin:5px 0 0;line-height:1.35;word-break:break-word;font-family:Arial,Helvetica,sans-serif;color:#000">${value || '—'}</p>` +
        `</div>`;
    }

    const datetime = formatDatetime(f.datetime);
    const ucZoneTehsilDistrict = `${f.uc || '___'} / ${f.zone || '___'} / ${f.tehsil || '___'} / ${f.district || '___'}`;
    const officerLine = `${user.name} (ID: ${user.staffId})`;
    const violation = f.violation_description || '___';
    
    const violationPhotoHtml = violationImagePreviewUrl ? `
<div style="margin:5px 0;text-align:center;">
  <p style="font-weight:bold;font-size:26pt;margin:0;text-transform:uppercase;line-height:1.35;letter-spacing:0.02em;font-family:Arial,Helvetica,sans-serif;color:#000">VIOLATION PHOTO</p>
  <img src="${violationImagePreviewUrl}" style="width:180px;height:auto;margin:4px auto 0;display:block;border:1px solid #000;" />
</div>
` : '';

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>Print Challan — ${noticeNo}</title>
<style>
@page{margin:0}
*{margin:0;padding:0;box-sizing:border-box}
html,body{background:#fff;width:100%}
.receipt-container{width:100%;margin:0 auto;padding:40px;font-family:Arial,Helvetica,sans-serif;color:#000}
</style></head><body>
<div class="receipt-container">

<table style="width:100%;border-collapse:collapse;margin-bottom:20px"><tr>
<td style="width:50%;text-align:center;padding:5px;border:none;vertical-align:middle"><img src="${PUNJAB_GOVT_LOGO}" style="width:180px;height:auto" alt="Govt of Punjab"></td>
<td style="width:50%;text-align:center;padding:5px;border:none;vertical-align:middle"><img src="${SUTHRA_PUNJAB_LOGO}" style="width:180px;height:auto" alt="Suthra Punjab"></td>
</tr></table>

<p style="text-align:center;font-weight:bold;font-size:34pt;margin-top:10px;margin-bottom:5px;color:#000;font-family:Arial,sans-serif;">GOVERNMENT OF PUNJAB</p>
<p style="text-align:center;font-weight:bold;font-size:30pt;margin:0;color:#000;font-family:Arial,sans-serif;">Suthra Punjab Agency Lahore (LWMC)</p>
<div style="height:25px"></div>
<p style="text-align:center;font-weight:bold;font-size:54pt;letter-spacing:2px;margin:10px 0;color:#000;text-decoration:underline;font-family:Arial,sans-serif;">e - C H A L L A N</p>
<p style="text-align:center;font-weight:bold;font-size:26pt;margin:0;color:#000;font-family:Arial,sans-serif;">WARNING NOTICE &middot; NO FINE IMPOSED</p>
<p style="text-align:center;font-weight:bold;font-size:32pt;margin-top:15px;margin-bottom:5px;color:#000;font-family:Arial,sans-serif;">Notice No.&nbsp;<span style="font-style:italic;font-weight:bold">${noticeNo}</span></p>
<p style="text-align:center;font-style:italic;font-size:22pt;line-height:1.4;margin:0;color:#000;font-family:Arial,sans-serif;">Issued under the Suthra Punjab Authority Act, 2026 (Act XII of 2026),<br>Schedule A (Littering / Improper Waste Disposal)</p>

${bar('Notice Details')}
${row('DATE &amp; TIME', datetime)}
${row('LOCATION', f.location || '___')}
${row('UC / ZONE / TEHSIL / DISTRICT', ucZoneTehsilDistrict)}
${row('ISSUING OFFICER (NAME &amp; ID)', officerLine)}

${bar('Citizen / Entity Details')}
${row('NAME', f.name || '___')}
${row('CNIC (IF CAPTURED)', f.cnic || '___')}
${row('CONTACT NUMBER', f.phone || '___')}
${row('ADDRESS', f.address || '___')}

${bar('Nature of Violation')}
<p style="font-style:italic;font-size:32pt;font-weight:bold;margin:15px 0;line-height:1.4;word-break:break-word;font-family:Arial,Helvetica,sans-serif;color:#000">&ldquo;${violation}, in violation of Schedule A of the Act.&rdquo;</p>
${violationPhotoHtml}

${bar('&#9888; WARNING NOTICE &#9888;')}
<div style="margin:20px 0">
<p style="font-weight:bold;font-size:30pt;line-height:1.4;margin-bottom:15px;font-family:Arial,Helvetica,sans-serif;color:#000">You are hereby WARNED for the above violation observed at the stated time and location. No monetary penalty has been imposed on this occasion.</p>
<p style="font-weight:normal;font-size:26pt;line-height:1.4;text-align:justify;margin:0;font-family:Arial,Helvetica,sans-serif;color:#000">Please note: under Section 16 of the Act, any subsequent violation of the same or related nature may result in a fine of up to Rs. 500,000/- and/or further enforcement action, without additional warning.</p>
</div>
${row('PRIOR WARNING COUNT FOR THIS ID / LOCATION', String(f.warning_count ?? '0'))}

<div style="height:30px"></div>
<p style="text-align:center;font-weight:bold;font-size:30pt;margin:0;color:#000;font-family:Arial,sans-serif;">Suthra Punjab Helpline: 1139</p>
<div style="height:25px"></div>
<p style="text-align:center;font-style:italic;font-size:24pt;margin:0;color:#000;font-family:Arial,sans-serif;">This is a computer-generated notice.</p>
<p style="text-align:center;font-size:24pt;margin-top:15px;color:#000;font-family:Arial,sans-serif;">---------------- &nbsp;end of notice&nbsp; ----------------</p>

</div></body></html>`;

    const printWin = window.open('', '_blank', 'width=800,height=900');
    if (!printWin) {
      alert('Pop-up blocked. Please allow pop-ups for this site to print.');
      return;
    }
    printWin.document.write(html);
    printWin.document.close();
    printWin.onload = () => {
      setTimeout(() => {
        printWin.focus();
        printWin.print();
        printWin.close();
      }, 400);
    };
  };

  const generatePDF = async (noticeNo: string) => {
    const el = previewRef.current;
    if (!el) return;
    setIsGenerating(true);

    try {
      // Wait for all images inside the preview to finish loading (logos etc.)
      const images = Array.from(el.querySelectorAll('img'));
      await Promise.all(
        images.map(img =>
          img.complete
            ? Promise.resolve()
            : new Promise<void>(resolve => {
                img.onload = () => resolve();
                img.onerror = () => resolve();
              })
        )
      );

      const canvas = await html2canvas(el, {
        scale: 3,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdfWidth = 80; // mm — 80mm thermal receipt width
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width; // dynamic — one continuous page

      const doc = new jsPDF({
        unit: 'mm',
        format: [pdfWidth, pdfHeight],
      });

      doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      doc.save(`Challan-${noticeNo}.pdf`);
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('PDF generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };


  const allErrors = Object.values(errors).map(e => e.message).filter(Boolean);

  return (
    <div className="challan-portal">
      {/* Mobile Tabs */}
      <div className="mobile-tabs md:hidden">
        <div className={`mobile-tab ${activeTab === 'form' ? 'active' : ''}`} onClick={() => setActiveTab('form')}>
          Edit Details
        </div>
        <div className={`mobile-tab ${activeTab === 'preview' ? 'active' : ''}`} onClick={() => setActiveTab('preview')}>
          Receipt
        </div>
      </div>

      <div id="app-container" className="flex gap-8 max-w-7xl mx-auto">
        {/* LEFT PANEL */}
        <section id="form-panel" className={`flex-1 ${activeTab === 'form' ? 'block' : 'hidden md:block'}`}>
          <div className="form-header-card">
            <h2>Challan Details Form</h2>
          </div>

          <div className="info-callout">
            <strong>Quick &amp; Easy Process:</strong>{' '}
            <span className="tip-copy-desktop">Fill in the required details below. The live preview on the right will update automatically.</span>
            <span className="tip-copy-mobile">Complete the details, then open Receipt to review the live preview before saving.</span>
          </div>

          <form id="challan-form" noValidate onSubmit={e => e.preventDefault()}>
            {/* Notice Info */}
            <fieldset>
              <div className="fieldset-header"><FileText className="w-4 h-4 text-muted-foreground" aria-hidden="true" /> Notice Information</div>
              <div className="fieldset-body">
                <div className="field-group">
                  <label>Notice No. <span className="req">*</span></label>
                  <input
                    key={assignedNoticeNo || 'pending'}
                    type="text"
                    readOnly
                    value={assignedNoticeNo || 'Will be assigned on save'}
                    className={assignedNoticeNo ? 'notice-number-reveal' : ''}
                  />
                </div>

                <div className="field-group">
                  <label>Date &amp; Time <span className="req">*</span></label>
                  <input type="datetime-local" {...register('datetime')} className={errors.datetime ? 'invalid' : ''} />
                </div>

                <div className="field-group">
                  <label>Location <span className="req">*</span></label>
                  <div className="flex gap-2">
                    <input type="text" {...register('location')} className={errors.location ? 'invalid' : ''} />
                    <button 
                      type="button" 
                      onClick={fetchLocation} 
                      disabled={isFetchingLocation}
                      className="px-3 py-2 bg-card text-ink border border-border rounded-sm text-sm font-medium hover:bg-surface-inset whitespace-nowrap"
                    >
                      {isFetchingLocation ? 'Fetching...' : 'Fetch Location'}
                    </button>
                  </div>
                </div>

                <div className="field-row">
                  <div className="field-group half">
                    <label>UC <span className="req">*</span> <small>(number only)</small></label>
                    <input type="number" min="0" {...register('uc')} className={errors.uc ? 'invalid' : ''} />
                  </div>
                  <div className="field-group half">
                    <label>Zone <span className="req">*</span> <small>(number only)</small></label>
                    <input type="number" min="0" {...register('zone')} className={errors.zone ? 'invalid' : ''} />
                  </div>
                </div>

                <div className="field-row">
                  <div className="field-group half">
                    <label>Tehsil <span className="req">*</span></label>
                    <select {...register('tehsil')} className={errors.tehsil ? 'invalid' : ''}>
                      {TOWNS.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div className="field-group half">
                    <label>District <span className="req">*</span></label>
                    <input type="text" {...register('district')} className={errors.district ? 'invalid' : ''} />
                  </div>
                </div>

                <div className="field-row">
                  <div className="field-group half">
                    <label>Issuing Officer Name <span className="req">*</span></label>
                    <input type="text" readOnly value={user.name} />
                  </div>
                  <div className="field-group half">
                    <label>Issuing Officer ID <span className="req">*</span></label>
                    <input type="text" readOnly value={user.staffId} />
                  </div>
                </div>
              </div>
            </fieldset>

            {/* Citizen Details */}
            <fieldset>
              <div className="fieldset-header"><User className="w-4 h-4 text-muted-foreground" aria-hidden="true" /> Citizen / Entity Details</div>
              <div className="fieldset-body">
                <div className="field-group">
                  <label>Citizen Name <span className="req">*</span></label>
                  <input type="text" {...register('name')} className={errors.name ? 'invalid' : ''} />
                </div>

                <div className="field-group">
                  <label>CNIC <small>(if captured)</small></label>
                  <input type="text" placeholder="35201-6424521-0" {...register('cnic')} className={errors.cnic ? 'invalid' : ''} />
                </div>

                <div className="field-group">
                  <label>Contact No</label>
                  <input type="tel" placeholder="0324-4094145" {...register('phone')} className={errors.phone ? 'invalid' : ''} />
                </div>

                <div className="field-group">
                  <label>Citizen Address <span className="req">*</span></label>
                  <textarea rows={2} {...register('address')} className={errors.address ? 'invalid' : ''}></textarea>
                </div>
              </div>
            </fieldset>

            {/* Violation Details */}
            <fieldset>
              <div className="fieldset-header"><AlertTriangle className="w-4 h-4 text-muted-foreground" aria-hidden="true" /> Violation Details</div>
              <div className="fieldset-body">
                <div className="field-group">
                  <label>Attach Violation Photo (Optional)</label>
                  <input 
                    type="file" 
                    accept="image/jpeg,image/png,image/heic"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 5 * 1024 * 1024) {
                        alert('Image size exceeds 5 MB limit.');
                        return;
                      }
                      try {
                        const compressedBlob = await compressImage(file);
                        const compressedFile = new File([compressedBlob], file.name, { type: 'image/jpeg' });
                        setViolationImage(compressedFile);
                        setViolationImagePreviewUrl(URL.createObjectURL(compressedBlob));
                      } catch {
                        alert('Failed to compress image.');
                      }
                    }}
                  />
                  {violationImagePreviewUrl && (
                    <div className="mt-2">
                      <img src={violationImagePreviewUrl} alt="Preview" className="w-24 h-auto rounded-md border" />
                      <button 
                        type="button" 
                        onClick={() => {
                          setViolationImage(null);
                          setViolationImagePreviewUrl(null);
                        }}
                        className="text-xs text-red-600 mt-1 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                <div className="field-group">
                  <label>Violation Description <span className="req">*</span></label>
                  <select {...register('violation_description')} className={errors.violation_description ? 'invalid' : ''}>
                    <option value="" disabled>Select a violation...</option>
                    <option value="Illegal Sewage or Drainage Discharge">Illegal Sewage or Drainage Discharge</option>
                    <option value="Prohibited Carcass Disposal">Prohibited Carcass Disposal</option>
                    <option value="Improper Offal and Animal Waste Disposal">Improper Offal and Animal Waste Disposal</option>
                    <option value="Public Littering and Waste Dumping">Public Littering and Waste Dumping</option>
                    <option value="Failure to Provide Premises Waste Disposal">Failure to Provide Premises Waste Disposal</option>
                    <option value="Uncleaned Premises Frontage">Uncleaned Premises Frontage</option>
                    <option value="Unmaintained Latrines, Urinals, or Drains">Unmaintained Latrines, Urinals, or Drains</option>
                    <option value="Plastic and Non-Perishable Waste Accumulation">Plastic and Non-Perishable Waste Accumulation</option>
                    <option value="Non-Compliance with Agency Directives">Non-Compliance with Agency Directives</option>
                    <option value="Unlicensed Waste Collection or Sorting">Unlicensed Waste Collection or Sorting</option>
                    <option value="Environmental Pollution and Health Hazard">Environmental Pollution and Health Hazard</option>
                    <option value="Abetment or Attempt of Offense">Abetment or Attempt of Offense</option>
                    <option value="Solid Waste Burning">Solid Waste Burning</option>
                    <option value="Obstruction of Waste Management Officers">Obstruction of Waste Management Officers</option>
                    <option value="Tyre Burning">Tyre Burning</option>
                  </select>
                  <small style={{ color: 'var(--gray-500)', display: 'block', marginTop: '0.5rem', fontStyle: 'italic' }}>
                    &ldquo;in violation of Schedule A of the Act.&rdquo; will be added automatically on the receipt.
                  </small>
                </div>

                <div className="field-group">
                  <label>Prior Warning Count <span className="req">*</span></label>
                  <input type="number" min="0" {...register('warning_count')} className={errors.warning_count ? 'invalid' : ''} />
                </div>
              </div>
            </fieldset>

            {(allErrors.length > 0 || saveError) && (
              <div id="validation-msg" role="alert">
                {saveError ? `Error: ${saveError}` : allErrors.join(' · ')}
              </div>
            )}

            <div className="form-actions">
              <button type="button" id="print-btn" onClick={() => handleSaveAndPrint('print')} disabled={isGenerating}>
                <Printer className="w-4 h-4 mr-2" aria-hidden="true" /> Print
              </button>
              <button type="button" id="generate-btn" onClick={() => handleSaveAndPrint('pdf')} disabled={isGenerating}>
                {isGenerating ? 'Saving…' : <><FileDown className="w-4 h-4 mr-2" aria-hidden="true" /> Save &amp; Download</>}
              </button>
            </div>
          </form>
        </section>

        {/* RIGHT PANEL */}
        <section id="preview-panel" className={`flex-1 sticky top-20 self-start ${activeTab === 'preview' ? 'block' : 'hidden md:block'}`}>
          <div className="preview-header">
            <h2>Live Receipt Preview</h2>
          </div>

          <div id="preview-card">
            {/* WRAPPER FOR PDF GENERATION/PRINTING */}
            <div id="print-root">
              <div id="challan-preview" ref={previewRef}>
                <table className="logo-row">
                  <tbody>
                    <tr>
                      <td className="logo-cell"><img src={PUNJAB_GOVT_LOGO} alt="Government of Punjab" className="logo-img" /></td>
                      <td className="logo-cell"><img src={SUTHRA_PUNJAB_LOGO} alt="Suthra Punjab" className="logo-img" /></td>
                    </tr>
                  </tbody>
                </table>

                <p className="header-line govt-name">GOVERNMENT OF PUNJAB</p>
                <p className="header-line agency-name">Suthra Punjab Agency Lahore (LWMC)</p>
                <div className="blank-line"></div>
                <p className="header-line echallan-title">e - C H A L L A N</p>
                <p className="header-line warning-subtitle">WARNING NOTICE &middot; NO FINE IMPOSED</p>
                <p className="header-line notice-no-line">Notice No.&nbsp; <span className="value-italic">{assignedNoticeNo || BLANK}</span></p>
                <p className="header-line legal-ref">Issued under the Suthra Punjab Authority Act, 2026 (Act XII of 2026), Schedule A</p>
                <p className="header-line legal-ref">(Littering / Improper Waste Disposal)</p>

                <div className="section-bar">Notice Details</div>

                <div className="detail-block">
                  <p className="detail-label">DATE &amp; TIME</p>
                  <p className="detail-value">{formatDatetime(formValues.datetime)}</p>
                </div>
                <div className="detail-block">
                  <p className="detail-label">LOCATION</p>
                  <p className="detail-value">{formValues.location || BLANK}</p>
                </div>
                <div className="detail-block">
                  <p className="detail-label">UC / ZONE / TEHSIL / DISTRICT</p>
                  <p className="detail-value">
                    <span>{formValues.uc || BLANK_SHORT}</span> / <span>{formValues.zone || BLANK_SHORT}</span> / <span>{formValues.tehsil || BLANK_SHORT}</span> /
                  </p>
                  <p className="detail-value"><span>{formValues.district || BLANK}</span></p>
                </div>
                <div className="detail-block">
                  <p className="detail-label">ISSUING OFFICER (Name &amp; ID)</p>
                  <p className="detail-value"><span>{user.name}</span> (ID: <span>{user.staffId}</span>)</p>
                </div>

                <div className="section-bar">Citizen / Entity Details</div>

                <div className="detail-block">
                  <p className="detail-label">NAME</p>
                  <p className="detail-value">{formValues.name || BLANK}</p>
                </div>
                <div className="detail-block">
                  <p className="detail-label">CNIC (IF CAPTURED)</p>
                  <p className="detail-value">{formValues.cnic || BLANK}</p>
                </div>
                <div className="detail-block">
                  <p className="detail-label">CONTACT NUMBER</p>
                  <p className="detail-value">{formValues.phone || BLANK}</p>
                </div>
                <div className="detail-block">
                  <p className="detail-label">ADDRESS</p>
                  <p className="detail-value">{formValues.address || BLANK}</p>
                </div>

                <div className="section-bar">Nature of Violation</div>

                <div className="detail-block">
                  <p className="violation-quote">&ldquo;{formValues.violation_description || BLANK}, in violation of Schedule A of the Act.&rdquo;</p>
                </div>

                {violationImagePreviewUrl && (
                  <div className="violation-photo-block">
                    <p className="detail-label">VIOLATION PHOTO</p>
                    <img src={violationImagePreviewUrl} className="violation-photo" />
                  </div>
                )}

                <div className="section-bar warning-bar">⚠&nbsp; WARNING NOTICE &nbsp;⚠</div>

                <div className="warning-block">
                  <p className="warning-primary">You are hereby WARNED for the above violation observed at the stated time and location. No monetary penalty has been imposed on this occasion.</p>
                  <p className="warning-secondary">Please note: under Section 16 of the Act, any subsequent violation of the same or related nature may result in a fine of up to Rs. 500,000/- and/or further enforcement action, without additional warning.</p>
                </div>
                <div className="detail-block">
                  <p className="detail-label">PRIOR WARNING COUNT FOR THIS ID / LOCATION</p>
                  <p className="detail-value">{formValues.warning_count || '0'}</p>
                </div>

                <div className="blank-line"></div>
                <p className="footer-line helpline">Suthra Punjab Helpline: 1139</p>
                <div className="blank-line"></div>
                <p className="footer-line disclaimer">This is a computer-generated notice.</p>
                <p className="footer-line end-rule">---------------- &nbsp;end of notice&nbsp; ----------------</p>

              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
