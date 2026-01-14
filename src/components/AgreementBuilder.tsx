import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, { FadeInDown, FadeIn, SlideInRight } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import {
  FileText,
  Plus,
  Check,
  X,
  ChevronRight,
  MessageSquare,
  Shield,
  Heart,
  Clock,
  Eye,
  Ban,
  Pencil,
  Trash2,
} from 'lucide-react-native';
import { RelationshipAgreement, AgreementSection } from '@/lib/types';
import { AGREEMENT_TEMPLATES } from '@/lib/mock-data';

interface AgreementBuilderProps {
  agreement?: RelationshipAgreement | null;
  onSave: (agreement: RelationshipAgreement) => void;
  onCancel: () => void;
}

const CATEGORY_CONFIG: {
  [key: string]: { icon: typeof MessageSquare; color: string; label: string };
} = {
  communication: { icon: MessageSquare, color: '#4ECDC4', label: 'Communication' },
  boundaries: { icon: Shield, color: '#FF6B6B', label: 'Boundaries' },
  intimacy: { icon: Heart, color: '#c084fc', label: 'Intimacy' },
  time: { icon: Clock, color: '#FFE66D', label: 'Time' },
  safety: { icon: Shield, color: '#45B7D1', label: 'Safety' },
  disclosure: { icon: Eye, color: '#96CEB4', label: 'Disclosure' },
  veto: { icon: Ban, color: '#DDA0DD', label: 'Veto Policy' },
  custom: { icon: Pencil, color: '#9ca3af', label: 'Custom' },
};

function SectionCard({
  section,
  index,
  onEdit,
  onDelete,
}: {
  section: AgreementSection;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const config = CATEGORY_CONFIG[section.category] || CATEGORY_CONFIG.custom;
  const Icon = config.icon;

  return (
    <Animated.View
      entering={SlideInRight.delay(index * 50).springify()}
      className="bg-zinc-800/50 rounded-2xl p-4 mb-3 border border-zinc-700/50"
    >
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-row items-center flex-1">
          <View
            className="w-8 h-8 rounded-lg items-center justify-center mr-3"
            style={{ backgroundColor: config.color + '30' }}
          >
            <Icon size={16} color={config.color} />
          </View>
          <View className="flex-1">
            <Text className="text-zinc-400 text-xs mb-0.5">{config.label}</Text>
            <Text className="text-white font-medium" numberOfLines={1}>
              {section.title}
            </Text>
          </View>
        </View>
        <View className="flex-row">
          <Pressable onPress={onEdit} className="p-2 mr-1">
            <Pencil size={16} color="#9ca3af" />
          </Pressable>
          <Pressable onPress={onDelete} className="p-2">
            <Trash2 size={16} color="#ef4444" />
          </Pressable>
        </View>
      </View>
      <Text className="text-zinc-300 text-sm leading-relaxed">{section.content}</Text>
    </Animated.View>
  );
}

function TemplateCard({
  template,
  onSelect,
  index,
}: {
  template: RelationshipAgreement;
  onSelect: () => void;
  index: number;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(index * 100).springify()}>
      <Pressable
        onPress={onSelect}
        className="bg-zinc-800/50 rounded-2xl p-4 mb-3 border border-zinc-700/50 active:bg-zinc-800"
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-white font-semibold text-base">{template.title}</Text>
            <Text className="text-zinc-400 text-sm mt-1">
              {template.sections.length} sections
            </Text>
          </View>
          <ChevronRight size={20} color="#9ca3af" />
        </View>
      </Pressable>
    </Animated.View>
  );
}

function SectionEditor({
  section,
  onSave,
  onCancel,
}: {
  section?: AgreementSection;
  onSave: (section: AgreementSection) => void;
  onCancel: () => void;
}) {
  const [category, setCategory] = useState<AgreementSection['category']>(
    section?.category || 'communication'
  );
  const [title, setTitle] = useState(section?.title || '');
  const [content, setContent] = useState(section?.content || '');

  const handleSave = () => {
    if (!title.trim() || !content.trim()) return;

    onSave({
      id: section?.id || `section-${Date.now()}`,
      category,
      title: title.trim(),
      content: content.trim(),
      agreed_by: section?.agreed_by || [],
      last_updated: new Date().toISOString(),
    });
  };

  const categories = Object.entries(CATEGORY_CONFIG).map(([key, config]) => ({
    id: key as AgreementSection['category'],
    ...config,
  }));

  return (
    <Animated.View entering={FadeIn} className="flex-1 bg-zinc-900 p-4">
      <Text className="text-white font-semibold text-lg mb-4">
        {section ? 'Edit Section' : 'Add Section'}
      </Text>

      {/* Category selector */}
      <Text className="text-zinc-400 text-sm mb-2">Category</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-4"
        style={{ flexGrow: 0 }}
      >
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isSelected = category === cat.id;
          return (
            <Pressable
              key={cat.id}
              onPress={() => setCategory(cat.id)}
              className={`mr-2 px-3 py-2 rounded-xl flex-row items-center ${
                isSelected ? 'border-2' : 'border border-zinc-700'
              }`}
              style={{
                borderColor: isSelected ? cat.color : undefined,
                backgroundColor: isSelected ? cat.color + '20' : 'transparent',
              }}
            >
              <Icon size={14} color={isSelected ? cat.color : '#9ca3af'} />
              <Text
                className={`ml-2 text-sm ${isSelected ? 'font-medium' : ''}`}
                style={{ color: isSelected ? cat.color : '#9ca3af' }}
              >
                {cat.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Title input */}
      <Text className="text-zinc-400 text-sm mb-2">Title</Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="e.g., Date Night Rules"
        placeholderTextColor="#6b7280"
        className="bg-zinc-800 rounded-xl px-4 py-3 text-white mb-4 border border-zinc-700"
      />

      {/* Content input */}
      <Text className="text-zinc-400 text-sm mb-2">Agreement Content</Text>
      <TextInput
        value={content}
        onChangeText={setContent}
        placeholder="Describe the agreement..."
        placeholderTextColor="#6b7280"
        multiline
        numberOfLines={6}
        className="bg-zinc-800 rounded-xl px-4 py-3 text-white mb-4 border border-zinc-700"
        style={{ minHeight: 120, textAlignVertical: 'top' }}
      />

      {/* Action buttons */}
      <View className="flex-row mt-auto">
        <Pressable
          onPress={onCancel}
          className="flex-1 py-3 rounded-xl bg-zinc-800 mr-2 items-center"
        >
          <Text className="text-white font-medium">Cancel</Text>
        </Pressable>
        <Pressable
          onPress={handleSave}
          disabled={!title.trim() || !content.trim()}
          className="flex-1"
        >
          <LinearGradient
            colors={['#c084fc', '#db2777']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              paddingVertical: 12,
              borderRadius: 12,
              alignItems: 'center',
              opacity: !title.trim() || !content.trim() ? 0.5 : 1,
            }}
          >
            <Text className="text-white font-semibold">Save Section</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </Animated.View>
  );
}

export default function AgreementBuilder({ agreement, onSave, onCancel }: AgreementBuilderProps) {
  const [step, setStep] = useState<'templates' | 'editing' | 'section'>(
    agreement ? 'editing' : 'templates'
  );
  const [title, setTitle] = useState(agreement?.title || '');
  const [sections, setSections] = useState<AgreementSection[]>(agreement?.sections || []);
  const [editingSection, setEditingSection] = useState<AgreementSection | undefined>();
  const [editingSectionIndex, setEditingSectionIndex] = useState<number | null>(null);

  const handleSelectTemplate = useCallback((template: RelationshipAgreement) => {
    setTitle(template.title);
    setSections([...template.sections]);
    setStep('editing');
  }, []);

  const handleStartBlank = useCallback(() => {
    setTitle('My Agreement');
    setSections([]);
    setStep('editing');
  }, []);

  const handleAddSection = useCallback(() => {
    setEditingSection(undefined);
    setEditingSectionIndex(null);
    setStep('section');
  }, []);

  const handleEditSection = useCallback((section: AgreementSection, index: number) => {
    setEditingSection(section);
    setEditingSectionIndex(index);
    setStep('section');
  }, []);

  const handleDeleteSection = useCallback((index: number) => {
    setSections((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSaveSection = useCallback(
    (section: AgreementSection) => {
      if (editingSectionIndex !== null) {
        setSections((prev) =>
          prev.map((s, i) => (i === editingSectionIndex ? section : s))
        );
      } else {
        setSections((prev) => [...prev, section]);
      }
      setStep('editing');
      setEditingSection(undefined);
      setEditingSectionIndex(null);
    },
    [editingSectionIndex]
  );

  const handleSaveAgreement = useCallback(() => {
    const newAgreement: RelationshipAgreement = {
      id: agreement?.id || `agreement-${Date.now()}`,
      user_id: 'user-1',
      title,
      sections,
      partner_ids: agreement?.partner_ids || [],
      is_template: false,
      created_at: agreement?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    onSave(newAgreement);
  }, [agreement, title, sections, onSave]);

  if (step === 'section') {
    return (
      <SectionEditor
        section={editingSection}
        onSave={handleSaveSection}
        onCancel={() => {
          setStep('editing');
          setEditingSection(undefined);
          setEditingSectionIndex(null);
        }}
      />
    );
  }

  if (step === 'templates') {
    return (
      <View className="flex-1 bg-zinc-900">
        <View className="p-4">
          <Text className="text-white font-bold text-2xl mb-2">Agreement Builder</Text>
          <Text className="text-zinc-400 mb-6">
            Start with a template or create your own agreement
          </Text>
        </View>

        <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
          {/* Start blank option */}
          <Animated.View entering={FadeInDown.delay(0).springify()}>
            <Pressable
              onPress={handleStartBlank}
              className="mb-4 border-2 border-dashed border-purple-500/50 rounded-2xl p-4 active:border-purple-500"
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-full bg-purple-500/20 items-center justify-center mr-3">
                  <Plus size={20} color="#c084fc" />
                </View>
                <View>
                  <Text className="text-white font-semibold">Start from scratch</Text>
                  <Text className="text-zinc-400 text-sm">Create a custom agreement</Text>
                </View>
              </View>
            </Pressable>
          </Animated.View>

          <Text className="text-zinc-400 text-sm font-medium mb-3 mt-4">TEMPLATES</Text>
          {AGREEMENT_TEMPLATES.map((template, index) => (
            <TemplateCard
              key={template.id}
              template={template}
              onSelect={() => handleSelectTemplate(template)}
              index={index + 1}
            />
          ))}
        </ScrollView>

        <View className="p-4">
          <Pressable
            onPress={onCancel}
            className="py-3 rounded-xl bg-zinc-800 items-center"
          >
            <Text className="text-white font-medium">Cancel</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-zinc-900"
    >
      <View className="p-4">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-white font-bold text-xl">Edit Agreement</Text>
          <Pressable onPress={onCancel} className="p-2">
            <X size={24} color="#9ca3af" />
          </Pressable>
        </View>

        {/* Title input */}
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Agreement Title"
          placeholderTextColor="#6b7280"
          className="bg-zinc-800 rounded-xl px-4 py-3 text-white text-lg font-semibold border border-zinc-700 mb-4"
        />
      </View>

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {sections.length === 0 ? (
          <View className="items-center py-8">
            <FileText size={40} color="#4b5563" />
            <Text className="text-zinc-500 mt-3">No sections yet</Text>
            <Text className="text-zinc-600 text-sm">Add your first agreement section</Text>
          </View>
        ) : (
          sections.map((section, index) => (
            <SectionCard
              key={section.id}
              section={section}
              index={index}
              onEdit={() => handleEditSection(section, index)}
              onDelete={() => handleDeleteSection(index)}
            />
          ))
        )}

        {/* Add section button */}
        <Pressable
          onPress={handleAddSection}
          className="border-2 border-dashed border-zinc-700 rounded-2xl p-4 items-center justify-center mb-4 active:border-purple-500"
        >
          <Plus size={24} color="#c084fc" />
          <Text className="text-purple-400 font-medium mt-2">Add Section</Text>
        </Pressable>
      </ScrollView>

      {/* Save button */}
      <View className="p-4">
        <Pressable onPress={handleSaveAgreement} disabled={sections.length === 0}>
          <LinearGradient
            colors={['#c084fc', '#db2777']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              paddingVertical: 16,
              borderRadius: 16,
              alignItems: 'center',
              opacity: sections.length === 0 ? 0.5 : 1,
            }}
          >
            <View className="flex-row items-center">
              <Check size={20} color="white" />
              <Text className="text-white font-bold text-lg ml-2">Save Agreement</Text>
            </View>
          </LinearGradient>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
