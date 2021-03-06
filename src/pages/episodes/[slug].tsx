import { format, parseISO } from 'date-fns'
import Image from 'next/image'
import Link from 'next/link'
import Head from 'next/head'
import { ptBR } from 'date-fns/locale'
import { useRouter } from 'next/router'
import next, { GetStaticPaths, GetStaticProps } from 'next'

import { api } from '../../services/api'
import { converDurationToTimeString } from '../../utils/convertDurationToTimeString'

import styles from './episode.module.scss'
import { PlayerContext, usePlayer } from '../../contexts/PlayerContext'
import React from 'react'

type Episodes = {
  id: string
  title: string
  thumbnail: string
  members: string
  duration: number
  durationAsString: string
  url: string
  published_at: string
  description: string
}

type EpisodeProps = {
  episode: Episodes
}

export default function Episode({ episode }: EpisodeProps) {
  const { play } = usePlayer()
  return (
    <div className={styles.episode}>
      <Head>
        <title>{episode.title} | Podcastr</title>
      </Head>
      <div className={styles.thumbnailContainer}>
        <Link href='/'>
          <button type='button'>
            <img src='/arrow-left.svg' alt='voltar' />
          </button>
        </Link>
        <Image
          width={700}
          height={160}
          src={episode.thumbnail}
          objectFit='cover'
        />
        <button type='button' onClick={() => play(episode)}>
          <img src='/play.svg' alt='tocar episódio' />
        </button>
      </div>

      <header>
        <h1>{episode.title}</h1>
        <span>{episode.members}</span>
        <span>{episode.published_at}</span>
        <span>{episode.durationAsString}</span>
      </header>

      <div
        className={styles.description}
        dangerouslySetInnerHTML={{ __html: episode.description }}
      />
    </div>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const { data } = await api.get('episodes', {
    params: {
      _limit: 2,
      _sort: 'published_at',
      _order: 'desc',
    },
  })

  const paths = data.map((episode) => {
    return {
      params: {
        slug: episode.id,
      },
    }
  })

  return {
    paths,
    fallback: 'blocking',
  }
}

export const getStaticProps: GetStaticProps = async (ctx) => {
  const { slug } = ctx.params

  const { data } = await api.get(`/episodes/${slug}`)

  const episode = {
    id: data.id,
    title: data.title,
    thumbnail: data.thumbnail,
    members: data.members,
    published_at: format(parseISO(data.published_at), 'd MMM yy', {
      locale: ptBR,
    }),
    duration: Number(data.file.duration),
    durationAsString: converDurationToTimeString(Number(data.file.duration)),
    description: data.description,
    url: data.file.url,
  }

  return {
    props: {
      episode,
    },
    revalidate: 60 * 60 * 24, //24h
  }
}
