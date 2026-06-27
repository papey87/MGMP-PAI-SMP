import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "../lib/supabase";
import { NewsItem, ArticleItem, MGMPEvent } from "../types";
import { RealtimeChannel } from "@supabase/supabase-js";

// Type definitions for context
interface MGMPContextType {
  // News
  news: NewsItem[];
  newsLoading: boolean;
  addNews: (data: Omit<NewsItem, "id">) => Promise<void>;
  updateNews: (id: string, data: Partial<NewsItem>) => Promise<void>;
  deleteNews: (id: string) => Promise<void>;

  // Articles
  articles: ArticleItem[];
  articlesLoading: boolean;
  addArticle: (data: Omit<ArticleItem, "id">) => Promise<void>;
  updateArticle: (id: string, data: Partial<ArticleItem>) => Promise<void>;
  deleteArticle: (id: string) => Promise<void>;

  // Events
  events: MGMPEvent[];
  eventsLoading: boolean;
  updateEvent: (id: string, data: Partial<MGMPEvent>) => Promise<void>;

  // Layout
  layoutConfig: {
    tabs: any[];
    homeSections: any[];
    customSections: any[];
  };
  layoutLoading: boolean;
  updateLayout: (data: Partial<any>) => Promise<void>;

  // Announcement
  announcement: {
    text: string;
    badgeText: string;
    actionUrl: string;
    actionType: "apk" | "link" | "none";
    blinking: boolean;
  };
  updateAnnouncement: (data: Partial<any>) => Promise<void>;

  // Profile
  profile: {
    visi: string;
    misi: string[];
    tujuan: any[];
    structure: any[];
  };
  updateProfile: (data: Partial<any>) => Promise<void>;

  // Connection status
  isConnected: boolean;
}

const defaultAnnouncement = {
  text: "Segera Install Aplikasi Android Resmi Portal MGMP PAI SMP Subang! Klik di sini untuk panduan instalasi & unduh.",
  badgeText: "INFO PENTING",
  actionUrl: "",
  actionType: "apk" as const,
  blinking: true,
};

const defaultLayoutConfig = {
  tabs: [
    { id: "beranda", label: "Beranda", visible: true },
    { id: "profil", label: "Profil MGMP", visible: true },
    { id: "informasi", label: "Informasi", visible: true },
    { id: "kegiatan", label: "Agenda Kegiatan", visible: true },
    { id: "perangkat", label: "Perangkat Ajar", visible: true },
    { id: "artikel", label: "Artikel", visible: true },
    { id: "ai-sobat", label: "Tanya AI Sobat Guru", visible: true },
  ],
  homeSections: [
    { id: "hero", label: "Hero Banner", visible: true, order: 1, title: "", subtitle: "", description: "", badgeText: "" },
    { id: "siladik", label: "Sistem Informasi SILADIK", visible: true, order: 2, title: "" },
    { id: "advice", label: "Kolom Berbagi Nasihat / Tulisan Guru", visible: true, order: 3, title: "", description: "" },
    { id: "news_quote", label: "Berita, Pengumuman & Ruang Inspirasi", visible: true, order: 4, title: "", description: "", quoteTitle: "", quoteDescription: "" },
  ],
  customSections: [],
};

const defaultProfile = {
  visi: "",
  misi: [],
  tujuan: [],
  structure: [],
};

// Create context with default values
const MGMPContext = createContext<MGMPContextType | null>(null);

// Provider component
export function MGMPProvider({ children }: { children: ReactNode }) {
  // News state
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);

  // Articles state
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(true);

  // Events state
  const [events, setEvents] = useState<MGMPEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  // Layout state
  const [layoutConfig, setLayoutConfig] = useState(defaultLayoutConfig);
  const [layoutLoading, setLayoutLoading] = useState(true);

  // Announcement state
  const [announcement, setAnnouncement] = useState(defaultAnnouncement);

  // Profile state
  const [profile, setProfile] = useState(defaultProfile);

  // Connection status
  const [isConnected, setIsConnected] = useState(false);

  // Load initial data and setup realtime subscriptions
  useEffect(() => {
    let newsChannel: RealtimeChannel;
    let articlesChannel: RealtimeChannel;
    let eventsChannel: RealtimeChannel;
    let settingsChannel: RealtimeChannel;

    const loadData = async () => {
      try {
        // Check connection
        const { error: connError } = await supabase.from('settings').select('id').limit(1);
        setIsConnected(!connError);

        // Load News
        const { data: newsData, error: newsError } = await supabase
          .from('news')
          .select('*')
          .order('created_at', { ascending: false });

        if (!newsError && newsData) {
          const formattedNews = newsData.map((item: any) => ({
            id: item.id,
            title: item.title,
            category: item.category,
            date: item.date,
            image: item.image || '',
            summary: item.summary || '',
            content: item.content || '',
          }));
          setNews(formattedNews);
        }
        setNewsLoading(false);

        // Load Articles
        const { data: articlesData, error: articlesError } = await supabase
          .from('articles')
          .select('*')
          .order('created_at', { ascending: false });

        if (!articlesError && articlesData) {
          const formattedArticles = articlesData.map((item: any) => ({
            id: item.id,
            nama: item.nama,
            asalSekolah: item.asal_sekolah,
            tanggalPenulisan: item.tanggal_penulisan,
            judul: item.judul,
            isi: item.isi,
          }));
          setArticles(formattedArticles);
        }
        setArticlesLoading(false);

        // Load Events
        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select('*')
          .order('created_at', { ascending: false });

        if (!eventsError && eventsData) {
          const formattedEvents = eventsData.map((item: any) => ({
            id: item.id,
            title: item.title,
            description: item.description || '',
            date: item.date,
            time: item.time || '',
            location: item.location || '',
            speaker: item.speaker || '',
            quota: item.quota || 0,
            registeredCount: item.registered_count || 0,
            status: item.status || 'Mendatang',
            banner: item.banner || '',
            category: item.category || 'Agenda Lainnya',
          }));
          setEvents(formattedEvents);
        }
        setEventsLoading(false);

        // Load Settings
        const { data: settingsData, error: settingsError } = await supabase
          .from('settings')
          .select('*');

        if (!settingsError && settingsData) {
          settingsData.forEach((setting: any) => {
            if (setting.id === 'layout' && setting.data) {
              setLayoutConfig((prev) => ({
                ...prev,
                ...setting.data,
              }));
            } else if (setting.id === 'announcement' && setting.data) {
              setAnnouncement((prev) => ({
                ...prev,
                ...setting.data,
              }));
            } else if (setting.id === 'profile' && setting.data) {
              setProfile((prev) => ({
                ...prev,
                ...setting.data,
              }));
            }
          });
        }
        setLayoutLoading(false);

        // Setup realtime subscriptions
        newsChannel = supabase
          .channel('news-changes')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'news' }, (payload) => {
            if (payload.eventType === 'INSERT') {
              const newItem = payload.new as any;
              setNews((prev) => [{
                id: newItem.id,
                title: newItem.title,
                category: newItem.category,
                date: newItem.date,
                image: newItem.image || '',
                summary: newItem.summary || '',
                content: newItem.content || '',
              }, ...prev]);
            } else if (payload.eventType === 'UPDATE') {
              const updatedItem = payload.new as any;
              setNews((prev) => prev.map((item) =>
                item.id === updatedItem.id ? {
                  id: updatedItem.id,
                  title: updatedItem.title,
                  category: updatedItem.category,
                  date: updatedItem.date,
                  image: updatedItem.image || '',
                  summary: updatedItem.summary || '',
                  content: updatedItem.content || '',
                } : item
              ));
            } else if (payload.eventType === 'DELETE') {
              const deletedItem = payload.old as any;
              setNews((prev) => prev.filter((item) => item.id !== deletedItem.id));
            }
          })
          .subscribe();

        articlesChannel = supabase
          .channel('articles-changes')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'articles' }, (payload) => {
            if (payload.eventType === 'INSERT') {
              const newItem = payload.new as any;
              setArticles((prev) => [{
                id: newItem.id,
                nama: newItem.nama,
                asalSekolah: newItem.asal_sekolah,
                tanggalPenulisan: newItem.tanggal_penulisan,
                judul: newItem.judul,
                isi: newItem.isi,
              }, ...prev]);
            } else if (payload.eventType === 'UPDATE') {
              const updatedItem = payload.new as any;
              setArticles((prev) => prev.map((item) =>
                item.id === updatedItem.id ? {
                  id: updatedItem.id,
                  nama: updatedItem.nama,
                  asalSekolah: updatedItem.asal_sekolah,
                  tanggalPenulisan: updatedItem.tanggal_penulisan,
                  judul: updatedItem.judul,
                  isi: updatedItem.isi,
                } : item
              ));
            } else if (payload.eventType === 'DELETE') {
              const deletedItem = payload.old as any;
              setArticles((prev) => prev.filter((item) => item.id !== deletedItem.id));
            }
          })
          .subscribe();

        eventsChannel = supabase
          .channel('events-changes')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, (payload) => {
            if (payload.eventType === 'INSERT') {
              const newItem = payload.new as any;
              setEvents((prev) => [{
                id: newItem.id,
                title: newItem.title,
                description: newItem.description || '',
                date: newItem.date,
                time: newItem.time || '',
                location: newItem.location || '',
                speaker: newItem.speaker || '',
                quota: newItem.quota || 0,
                registeredCount: newItem.registered_count || 0,
                status: newItem.status || 'Mendatang',
                banner: newItem.banner || '',
                category: newItem.category || 'Agenda Lainnya',
              }, ...prev]);
            } else if (payload.eventType === 'UPDATE') {
              const updatedItem = payload.new as any;
              setEvents((prev) => prev.map((item) =>
                item.id === updatedItem.id ? {
                  id: updatedItem.id,
                  title: updatedItem.title,
                  description: updatedItem.description || '',
                  date: updatedItem.date,
                  time: updatedItem.time || '',
                  location: updatedItem.location || '',
                  speaker: updatedItem.speaker || '',
                  quota: updatedItem.quota || 0,
                  registeredCount: updatedItem.registered_count || 0,
                  status: updatedItem.status || 'Mendatang',
                  banner: updatedItem.banner || '',
                  category: updatedItem.category || 'Agenda Lainnya',
                } : item
              ));
            } else if (payload.eventType === 'DELETE') {
              const deletedItem = payload.old as any;
              setEvents((prev) => prev.filter((item) => item.id !== deletedItem.id));
            }
          })
          .subscribe();

        settingsChannel = supabase
          .channel('settings-changes')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, (payload) => {
            const updatedSetting = payload.new as any;
            if (updatedSetting.id === 'layout' && updatedSetting.data) {
              setLayoutConfig((prev) => ({ ...prev, ...updatedSetting.data }));
            } else if (updatedSetting.id === 'announcement' && updatedSetting.data) {
              setAnnouncement((prev) => ({ ...prev, ...updatedSetting.data }));
            } else if (updatedSetting.id === 'profile' && updatedSetting.data) {
              setProfile((prev) => ({ ...prev, ...updatedSetting.data }));
            }
          })
          .subscribe();

      } catch (err) {
        console.error('Error loading data from Supabase:', err);
        setNewsLoading(false);
        setArticlesLoading(false);
        setEventsLoading(false);
        setLayoutLoading(false);
      }
    };

    loadData();

    return () => {
      if (newsChannel) supabase.removeChannel(newsChannel);
      if (articlesChannel) supabase.removeChannel(articlesChannel);
      if (eventsChannel) supabase.removeChannel(eventsChannel);
      if (settingsChannel) supabase.removeChannel(settingsChannel);
    };
  }, []);

  // CRUD operations
  const addNews = async (data: Omit<NewsItem, "id">) => {
    const { error } = await supabase.from('news').insert({
      title: data.title,
      category: data.category,
      date: data.date,
      image: data.image,
      summary: data.summary,
      content: data.content,
    });
    if (error) throw error;
  };

  const updateNews = async (id: string, data: Partial<NewsItem>) => {
    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.date !== undefined) updateData.date = data.date;
    if (data.image !== undefined) updateData.image = data.image;
    if (data.summary !== undefined) updateData.summary = data.summary;
    if (data.content !== undefined) updateData.content = data.content;

    const { error } = await supabase.from('news').update(updateData).eq('id', id);
    if (error) throw error;
  };

  const deleteNews = async (id: string) => {
    const { error } = await supabase.from('news').delete().eq('id', id);
    if (error) throw error;
  };

  const addArticle = async (data: Omit<ArticleItem, "id">) => {
    const { error } = await supabase.from('articles').insert({
      nama: data.nama,
      asal_sekolah: data.asalSekolah,
      tanggal_penulisan: data.tanggalPenulisan,
      judul: data.judul,
      isi: data.isi,
    });
    if (error) throw error;
  };

  const updateArticle = async (id: string, data: Partial<ArticleItem>) => {
    const updateData: any = {};
    if (data.nama !== undefined) updateData.nama = data.nama;
    if (data.asalSekolah !== undefined) updateData.asal_sekolah = data.asalSekolah;
    if (data.tanggalPenulisan !== undefined) updateData.tanggal_penulisan = data.tanggalPenulisan;
    if (data.judul !== undefined) updateData.judul = data.judul;
    if (data.isi !== undefined) updateData.isi = data.isi;

    const { error } = await supabase.from('articles').update(updateData).eq('id', id);
    if (error) throw error;
  };

  const deleteArticle = async (id: string) => {
    const { error } = await supabase.from('articles').delete().eq('id', id);
    if (error) throw error;
  };

  const updateEvent = async (id: string, data: Partial<MGMPEvent>) => {
    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.date !== undefined) updateData.date = data.date;
    if (data.time !== undefined) updateData.time = data.time;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.speaker !== undefined) updateData.speaker = data.speaker;
    if (data.quota !== undefined) updateData.quota = data.quota;
    if (data.registeredCount !== undefined) updateData.registered_count = data.registeredCount;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.banner !== undefined) updateData.banner = data.banner;
    if (data.category !== undefined) updateData.category = data.category;

    const { error } = await supabase.from('events').update(updateData).eq('id', id);
    if (error) throw error;
  };

  const updateLayout = async (data: Partial<any>) => {
    const { error } = await supabase
      .from('settings')
      .update({ data, updated_at: new Date().toISOString() })
      .eq('id', 'layout');
    if (error) throw error;
  };

  const updateAnnouncement = async (data: Partial<any>) => {
    const { error } = await supabase
      .from('settings')
      .update({ data, updated_at: new Date().toISOString() })
      .eq('id', 'announcement');
    if (error) throw error;
  };

  const updateProfile = async (data: Partial<any>) => {
    const { error } = await supabase
      .from('settings')
      .update({ data, updated_at: new Date().toISOString() })
      .eq('id', 'profile');
    if (error) throw error;
  };

  const value: MGMPContextType = {
    news,
    newsLoading,
    addNews,
    updateNews,
    deleteNews,

    articles,
    articlesLoading,
    addArticle,
    updateArticle,
    deleteArticle,

    events,
    eventsLoading,
    updateEvent,

    layoutConfig,
    layoutLoading,
    updateLayout,

    announcement,
    updateAnnouncement,

    profile,
    updateProfile,

    isConnected,
  };

  return (
    <MGMPContext.Provider value={value}>
      {children}
    </MGMPContext.Provider>
  );
}

// Custom hook to use the context
export function useMGMP() {
  const context = useContext(MGMPContext);
  if (!context) {
    throw new Error("useMGMP must be used within an MGMPProvider");
  }
  return context;
}

// Convenience hooks for specific data
export function useNewsData() {
  const { news, newsLoading, addNews, updateNews, deleteNews } = useMGMP();
  return { news, loading: newsLoading, addNews, updateNews, deleteNews };
}

export function useArticlesData() {
  const { articles, articlesLoading, addArticle, updateArticle, deleteArticle } = useMGMP();
  return { articles, loading: articlesLoading, addArticle, updateArticle, deleteArticle };
}

export function useEventsData() {
  const { events, eventsLoading, updateEvent } = useMGMP();
  return { events, loading: eventsLoading, updateEvent };
}

export function useLayoutData() {
  const { layoutConfig, layoutLoading, updateLayout } = useMGMP();
  return { layoutConfig, loading: layoutLoading, updateLayout };
}

export function useAnnouncementData() {
  const { announcement, updateAnnouncement } = useMGMP();
  return { announcement, updateAnnouncement };
}

export function useProfileData() {
  const { profile, updateProfile } = useMGMP();
  return { profile, updateProfile };
}
