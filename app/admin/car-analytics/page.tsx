"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableCaption } from "@/components/ui/table";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useLanguage } from "@/contexts/LanguageContext";

interface CarAnalytics {
  id: number;
  brand_id: number;
  brand_name: string;
  brand_name_ar?: string;
  model_id: number;
  model_name: string;
  model_name_ar?: string;
  favorites_count: number;
  views_count: number;
  price?: number;
  year?: number;
  created_at?: string;
}

export default function CarAnalyticsPage() {
  const { t, language } = useLanguage();
  const [analytics, setAnalytics] = useState<CarAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      setError(null);
      try {
        const { data, error } = await supabase
          .rpc("car_analytics_overview")
          .select('*')
          .order('favorites_count', { ascending: false });

        if (error) throw error;
        setAnalytics(data || []);
      } catch (err) {
        setError(t("admin.carAnalytics.error", "Failed to load analytics"));
        console.error("Error fetching analytics:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, [t]);

  if (loading) {
    return <LoadingSpinner fullPage />;
  }

  if (error) {
    return (
      <div className="text-center text-red-600 dark:text-red-400 py-12">
        {error}
      </div>
    );
  }

  if (analytics.length === 0) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-12">
        {t("admin.carAnalytics.empty", "No car analytics available.")}
      </div>
    );
  }

  // Calculate totals
  const totalFavorites = analytics.reduce((sum, car) => sum + (car.favorites_count || 0), 0);
  const totalViews = analytics.reduce((sum, car) => sum + (car.views_count || 0), 0);
  const totalCars = analytics.length;
  
  // Get most recent cars
  const recentCars = [...analytics]
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
    .slice(0, 5);

  // Get top performing cars
  const mostFavorited = [...analytics]
    .sort((a, b) => (b.favorites_count || 0) - (a.favorites_count || 0))
    .slice(0, 10);

  const mostViewed = [...analytics]
    .sort((a, b) => (b.views_count || 0) - (a.views_count || 0))
    .slice(0, 10);

  // Helper functions
  const getBrand = (car: CarAnalytics) => 
    language === "ar" ? car.brand_name_ar || car.brand_name : car.brand_name;
    
  const getModel = (car: CarAnalytics) => 
    language === "ar" ? car.model_name_ar || car.model_name : car.model_name;

  const StatCard = ({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
      <div className="flex items-center">
        <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
          {icon}
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-semibold">{value}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">{t("admin.carAnalytics.title", "Car Analytics")}</h1>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title={t("admin.carAnalytics.totalCars", "Total Cars")} 
          value={totalCars.toLocaleString()}
          icon={<span>🚗</span>}
        />
        <StatCard 
          title={t("admin.carAnalytics.totalFavorites", "Total Favorites")} 
          value={totalFavorites.toLocaleString()}
          icon={<span>❤️</span>}
        />
        <StatCard 
          title={t("admin.carAnalytics.totalViews", "Total Views")} 
          value={totalViews.toLocaleString()}
          icon={<span>👁️</span>}
        />
        <StatCard 
          title={t("admin.carAnalytics.avgViews", "Avg. Views/Car")} 
          value={totalCars > 0 ? Math.round(totalViews / totalCars) : 0}
          icon={<span>📊</span>}
        />
      </div>

      {/* Most Favorited */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 text-primary">
          {t("admin.carAnalytics.mostFavorited", "Most Favorited Cars")}
          <span className="text-sm text-gray-500 ml-2">
            ({t("admin.carAnalytics.top10", "Top 10")})
          </span>
        </h2>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>{t("car.brand", "Brand")}</TableHead>
                <TableHead>{t("car.model", "Model")}</TableHead>
                <TableHead>{t("car.year", "Year")}</TableHead>
                <TableHead className="text-right">{t("admin.carAnalytics.favorites", "Favorites")}</TableHead>
                <TableHead className="text-right">{t("admin.carAnalytics.views", "Views")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mostFavorited.map((car, idx) => (
                <TableRow key={car.id} className={idx === 0 ? "bg-yellow-50 dark:bg-yellow-900/30" : ""}>
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell className="font-medium">{getBrand(car)}</TableCell>
                  <TableCell>{getModel(car)}</TableCell>
                  <TableCell>{car.year}</TableCell>
                  <TableCell className="text-right">{car.favorites_count.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{car.views_count.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* Most Viewed */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 text-primary">
          {t("admin.carAnalytics.mostViewed", "Most Viewed Cars")}
          <span className="text-sm text-gray-500 ml-2">
            ({t("admin.carAnalytics.top10", "Top 10")})
          </span>
        </h2>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>{t("car.brand", "Brand")}</TableHead>
                <TableHead>{t("car.model", "Model")}</TableHead>
                <TableHead>{t("car.year", "Year")}</TableHead>
                <TableHead className="text-right">{t("admin.carAnalytics.views", "Views")}</TableHead>
                <TableHead className="text-right">{t("admin.carAnalytics.favorites", "Favorites")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mostViewed.map((car, idx) => (
                <TableRow key={car.id} className={idx === 0 ? "bg-blue-50 dark:bg-blue-900/30" : ""}>
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell className="font-medium">{getBrand(car)}</TableCell>
                  <TableCell>{getModel(car)}</TableCell>
                  <TableCell>{car.year}</TableCell>
                  <TableCell className="text-right">{car.views_count.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{car.favorites_count.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* Recently Added */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 text-primary">
          {t("admin.carAnalytics.recentlyAdded", "Recently Added Cars")}
        </h2>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("car.brand", "Brand")}</TableHead>
                <TableHead>{t("car.model", "Model")}</TableHead>
                <TableHead>{t("car.year", "Year")}</TableHead>
                <TableHead className="text-right">{t("car.price", "Price")}</TableHead>
                <TableHead className="text-right">{t("admin.carAnalytics.addedOn", "Added On")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentCars.map((car) => (
                <TableRow key={car.id}>
                  <TableCell className="font-medium">{getBrand(car)}</TableCell>
                  <TableCell>{getModel(car)}</TableCell>
                  <TableCell>{car.year}</TableCell>
                  <TableCell className="text-right">
                    {car.price?.toLocaleString(language, { 
                      style: 'currency', 
                      currency: 'QAR',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0 
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    {new Date(car.created_at || '').toLocaleDateString(language, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}