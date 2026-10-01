import React, { useEffect, useState } from "react";
import { FileText, Plus, Save, Trash2 } from "lucide-react";
import apiCall from "../utils/apiCall";
import { toast } from "react-hot-toast";

const inputClass = "w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-gray-900 dark:text-white";

const emptyContact = { company_name: "", email: "", phone: "", sales_email: "", sales_phone: "", address: "", footer_text: "" };

export default function WebsiteContent() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [contact, setContact] = useState(emptyContact);
  const [pages, setPages] = useState([]);
  const [selected, setSelected] = useState("contact");

  const load = async () => {
    setLoading(true);
    try {
      const response = await apiCall("/website");
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Unable to load website content");
      setContact(result.data.contact);
      setPages(result.data.pages || []);
    } catch (error) {
      toast.error(error.message || "Unable to load website content");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const page = pages.find((item) => item.slug === selected);

  const updatePage = (patch) => {
    setPages((current) => current.map((item) => item.slug === selected ? { ...item, ...patch } : item));
  };

  const updateSection = (index, patch) => {
    if (!page) return;
    const sections = page.sections.map((section, sectionIndex) => sectionIndex === index ? { ...section, ...patch } : section);
    updatePage({ sections });
  };

  const saveContact = async () => {
    setSaving(true);
    try {
      const response = await apiCall("/website/contact", "PUT", contact);
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Unable to save contact details");
      setContact(result.data.contact);
      setPages(result.data.pages || []);
      toast.success("Contact details saved");
    } catch (error) {
      toast.error(error.message || "Unable to save contact details");
    } finally {
      setSaving(false);
    }
  };

  const savePage = async () => {
    if (!page) return;
    setSaving(true);
    try {
      const response = await apiCall(`/website/pages/${page.slug}`, "PUT", {
        title: page.title,
        description: page.description,
        updated_label: page.updated_label,
        sections: page.sections,
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Unable to save page");
      setPages(result.data.pages || []);
      toast.success("Page saved");
    } catch (error) {
      toast.error(error.message || "Unable to save page");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6 text-sm text-gray-500">Loading website content...</div>;

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6 flex items-center gap-2 text-gray-900 dark:text-white">
        <FileText className="h-5 w-5 text-blue-600" />
        <div>
          <h1 className="text-2xl font-semibold">Website content</h1>
          <p className="mt-1 text-sm text-gray-500">Contact details and legal pages are published on the public website. Use {"{{company}}"}, {"{{email}}"}, {"{{phone}}"}, {"{{sales_email}}"}, {"{{sales_phone}}"}, and {"{{address}}"} in page text. Links use [label](/path).</p>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="space-y-1">
          <button type="button" onClick={() => setSelected("contact")} className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium ${selected === "contact" ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"}`}>Contact details</button>
          {pages.map((item) => (
            <button key={item.slug} type="button" onClick={() => setSelected(item.slug)} className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium ${selected === item.slug ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"}`}>{item.title}</button>
          ))}
        </aside>
        {selected === "contact" ? (
          <form className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900" onSubmit={(event) => { event.preventDefault(); saveContact(); }}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Company name<input className={`${inputClass} mt-1.5`} value={contact.company_name} onChange={(event) => setContact({ ...contact, company_name: event.target.value })} /></label>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Email<input className={`${inputClass} mt-1.5`} value={contact.email} onChange={(event) => setContact({ ...contact, email: event.target.value })} /></label>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Phone<input className={`${inputClass} mt-1.5`} value={contact.phone} onChange={(event) => setContact({ ...contact, phone: event.target.value })} /></label>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Sales email<input className={`${inputClass} mt-1.5`} value={contact.sales_email || ""} onChange={(event) => setContact({ ...contact, sales_email: event.target.value })} /></label>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Sales phone<input className={`${inputClass} mt-1.5`} value={contact.sales_phone || ""} onChange={(event) => setContact({ ...contact, sales_phone: event.target.value })} /></label>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Address<textarea rows={4} className={`${inputClass} mt-1.5`} value={contact.address} onChange={(event) => setContact({ ...contact, address: event.target.value })} /></label>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Footer text<textarea rows={3} className={`${inputClass} mt-1.5`} value={contact.footer_text} onChange={(event) => setContact({ ...contact, footer_text: event.target.value })} /></label>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"><Save className="h-4 w-4" />{saving ? "Saving..." : "Save contact"}</button>
          </form>
        ) : page ? (
          <form className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900" onSubmit={(event) => { event.preventDefault(); savePage(); }}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Title<input className={`${inputClass} mt-1.5`} value={page.title} onChange={(event) => updatePage({ title: event.target.value })} /></label>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Description<textarea rows={2} className={`${inputClass} mt-1.5`} value={page.description} onChange={(event) => updatePage({ description: event.target.value })} /></label>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Last updated label<input className={`${inputClass} mt-1.5`} value={page.updated_label} onChange={(event) => updatePage({ updated_label: event.target.value })} /></label>
            <div className="space-y-4">
              {page.sections.map((section, index) => (
                <div key={`${page.slug}-${index}`} className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Section {index + 1}</p>
                    <button type="button" onClick={() => updatePage({ sections: page.sections.filter((_, sectionIndex) => sectionIndex !== index) })} className="inline-flex items-center gap-1 text-sm text-rose-600"><Trash2 className="h-4 w-4" /> Remove</button>
                  </div>
                  <input className={inputClass} value={section.heading} onChange={(event) => updateSection(index, { heading: event.target.value })} placeholder="Heading" />
                  <textarea rows={6} className={`${inputClass} mt-3`} value={section.body} onChange={(event) => updateSection(index, { body: event.target.value })} placeholder="Body" />
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => updatePage({ sections: [...page.sections, { heading: "", body: "" }] })} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:border-gray-600 dark:text-gray-200"><Plus className="h-4 w-4" /> Add section</button>
              <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"><Save className="h-4 w-4" />{saving ? "Saving..." : "Save page"}</button>
            </div>
          </form>
        ) : null}
      </div>
    </div>
  );
}
