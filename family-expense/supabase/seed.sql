-- Seed default categories
INSERT INTO public.categories (name, icon, type, color, is_default) VALUES
-- Expense categories
('Ăn uống', '🍜', 'EXPENSE', '#EF4444', TRUE),
('Nhà ở', '🏠', 'EXPENSE', '#F59E0B', TRUE),
('Đi lại', '🚗', 'EXPENSE', '#10B981', TRUE),
('Mua sắm', '🛒', 'EXPENSE', '#3B82F6', TRUE),
('Giáo dục', '📚', 'EXPENSE', '#8B5CF6', TRUE),
('Y tế', '⚕️', 'EXPENSE', '#EC4899', TRUE),
('Giải trí', '🎮', 'EXPENSE', '#14B8A6', TRUE),
('Hóa đơn', '📄', 'EXPENSE', '#6366F1', TRUE),
('Khác', '📦', 'EXPENSE', '#6B7280', TRUE),

-- Income categories
('Lương', '💰', 'INCOME', '#10B981', TRUE),
('Thưởng', '🎁', 'INCOME', '#F59E0B', TRUE),
('Đầu tư', '📈', 'INCOME', '#3B82F6', TRUE),
('Khác', '💵', 'INCOME', '#6B7280', TRUE)
ON CONFLICT DO NOTHING;